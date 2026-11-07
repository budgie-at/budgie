import {
    buildHouseholdRemovalStatements,
    Db,
    HOUSEHOLD_SYNC_ZONE,
    SettingsRepository,
    SYNC_IDENTITY_TABLES,
    SyncZoneRegistryRepository,
    SyncZoneRoleEnum
} from '@budgie/contracts';
import * as schema from '@budgie/contracts/schema';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as DateTime from 'effect/DateTime';
import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Semaphore from 'effect/Semaphore';
import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { appAtomRegistry } from '../../@generic/constant/app-atom-registry.constant';
import { DatabaseRekeyService } from '../../@generic/drizzle/service/database-rekey.service';
import { readLastMigrationCreatedAt } from '../../@generic/drizzle/utils/read-last-migration-created-at.util';
import { cloudBackupStatusAtom } from '../constant/cloud-backup-status-atom.constant';
import { CloudBackupStatusEnum } from '../enum/cloud-backup-status.enum';
import { CloudAccountUnavailableError } from '../error/cloud-account-unavailable.error';
import { CloudNetworkUnavailableError } from '../error/cloud-network-unavailable.error';
import { CloudQuotaExceededError } from '../error/cloud-quota-exceeded.error';
import { discardRestoreSafetyCopy } from '../utils/discard-restore-safety-copy.util';

import { CloudTransport } from './cloud-transport.service';
import { InstallIdService } from './install-id.service';

import type { ICloudBackupMetadata } from '../../../modules/icloud';

export class CloudBackupService extends Context.Service<CloudBackupService>()('@budgie/app/CloudBackupService', {
    make: Effect.gen(function* () {
        const settingsRepository = yield* SettingsRepository;
        const zoneRegistryRepository = yield* SyncZoneRegistryRepository;
        const cloudTransport = yield* CloudTransport;
        const databaseRekeyService = yield* DatabaseRekeyService;
        const installIdService = yield* InstallIdService;
        const runningBackup = yield* Semaphore.make(1);
        const dayMilliseconds = Duration.toMillis(Duration.days(1));
        const dailyBackupCount = 7;
        const weeklyBackupCount = 4;
        const otherInstallRetentionDays = 90;
        const otherInstallRetentionMilliseconds = Duration.toMillis(Duration.days(otherInstallRetentionDays));
        const appVersion = Constants.expoConfig?.version ?? '1.0.0';
        const deviceName = Constants.deviceName ?? Platform.OS;
        const deviceModel = Platform.OS === 'ios' ? Platform.constants.interfaceIdiom : Platform.OS;
        const userDataTableNames = new Set(SYNC_IDENTITY_TABLES.map(table => table.name));
        const timestampColumnNames = new Set(['created_at', 'updated_at', 'deleted_at']);
        const LastChangedRowsSchema = Schema.NonEmptyArray(Schema.Struct({ lastChangedAt: Schema.NullOr(Schema.Finite) }));
        const lastChangedAtSql = String.raw`SELECT MAX(lastChangedAt) AS lastChangedAt FROM (${Object.values(schema)
            .map(table => getTableConfig(table))
            .filter(config => userDataTableNames.has(config.name))
            .flatMap(config =>
                config.columns
                    .filter(column => timestampColumnNames.has(column.name))
                    .map(column => String.raw`SELECT MAX(${column.name}) AS lastChangedAt FROM ${config.name}`)
            )
            .join(String.raw` UNION ALL `)})`;

        const selectBackupsToDelete = (backups: readonly ICloudBackupMetadata[], installId: string, now: number): readonly string[] => {
            const datedBackups = backups
                .map(backup => ({ ...backup, timestamp: Date.parse(backup.createdAt) }))
                .filter(backup => Number.isFinite(backup.timestamp));
            const ownBackups = datedBackups
                .filter(backup => backup.installId === installId)
                .sort((first, second) => second.timestamp - first.timestamp);
            const today = Math.floor(now / dayMilliseconds);
            const retainedBuckets = new Set<string>();
            const retainedRecordNames = new Set<string>();

            ownBackups.forEach(backup => {
                const ageInDays = today - Math.floor(backup.timestamp / dayMilliseconds);
                const weekIndex = Math.floor((ageInDays - dailyBackupCount) / 7);
                const bucket = ageInDays < dailyBackupCount ? `day:${ageInDays}` : `week:${weekIndex}`;

                if ((ageInDays < dailyBackupCount || weekIndex < weeklyBackupCount) && !retainedBuckets.has(bucket)) {
                    retainedBuckets.add(bucket);
                    retainedRecordNames.add(backup.recordName);
                }
            });

            return [
                ...ownBackups.filter(backup => !retainedRecordNames.has(backup.recordName)),
                ...datedBackups.filter(
                    backup => backup.installId !== installId && now - backup.timestamp > otherInstallRetentionMilliseconds
                )
            ].map(backup => backup.recordName);
        };

        const hasUserDataChangedSince = Effect.fn('CloudBackupService.hasUserDataChangedSince')(function* (lastBackupAt: Date | null) {
            const rows = yield* Db.query(db => db.$client.unsafe(lastChangedAtSql));
            const [{ lastChangedAt }] = yield* Schema.decodeUnknownEffect(LastChangedRowsSchema)(rows);

            return isDefined(lastChangedAt) && lastChangedAt >= Math.floor((lastBackupAt?.getTime() ?? 0) / 1000);
        });

        const applyRetention = Effect.fn('CloudBackupService.applyRetention')(function* (installId: string) {
            const backups = yield* cloudTransport.listBackups;
            const now = yield* Clock.currentTimeMillis;
            const recordNames = selectBackupsToDelete(backups, installId, now);

            if (isNotEmptyArray(recordNames)) {
                yield* cloudTransport.deleteBackups(recordNames);
            }
        });

        const deleteTemporaryFile = (file: File): void => {
            if (file.exists) {
                file.delete();
            }
        };

        const uploadBackup = Effect.fn('CloudBackupService.uploadBackup')(function* (startedAt: Date) {
            const installId = yield* installIdService.get;
            const backupKey = yield* databaseRekeyService.generateKey();
            const schemaVersion = (yield* Db.query(db => readLastMigrationCreatedAt(db.$client))) ?? 0;
            const temporaryFile = new File(Paths.cache, `cloud-backup-${startedAt.getTime()}.db`);
            const temporaryPath = decodeURIComponent(temporaryFile.uri.replace(/^file:\/\//u, ''));
            const household = yield* zoneRegistryRepository.findByLabel(HOUSEHOLD_SYNC_ZONE);
            const scrubStatements = household?.role === SyncZoneRoleEnum.PARTICIPANT ? buildHouseholdRemovalStatements('migrated.') : [];

            yield* Effect.acquireUseRelease(
                Effect.sync(() => {
                    deleteTemporaryFile(temporaryFile);
                }),
                () =>
                    databaseRekeyService
                        .exportEncryptedCopy(temporaryPath, backupKey, scrubStatements)
                        .pipe(
                            Effect.andThen(
                                cloudTransport.saveBackup(
                                    temporaryFile.uri,
                                    { createdAt: startedAt.toISOString(), installId, deviceName, deviceModel, appVersion, schemaVersion },
                                    { backupKey }
                                )
                            )
                        ),
                () =>
                    Effect.sync(() => {
                        deleteTemporaryFile(temporaryFile);
                    })
            );

            return installId;
        });

        const runBackup = Effect.fn('CloudBackupService.runBackup')(function* (minimumAgeMilliseconds: number) {
            const settings = yield* settingsRepository.getSettings();
            const startedAt = yield* DateTime.nowAsDate;

            if (!settings.cloudBackupEnabled) {
                return false;
            }

            if (
                isDefined(settings.lastCloudBackupAt) &&
                startedAt.getTime() - settings.lastCloudBackupAt.getTime() < minimumAgeMilliseconds
            ) {
                return false;
            }

            if (!(yield* hasUserDataChangedSince(settings.lastCloudBackupAt))) {
                return false;
            }

            if ((yield* cloudTransport.getAccountStatus).status !== 'available') {
                return false;
            }

            const installId = yield* uploadBackup(startedAt);

            yield* settingsRepository.update({ lastCloudBackupAt: startedAt });
            discardRestoreSafetyCopy();
            yield* applyRetention(installId);

            return true;
        });

        const isQuotaExceeded = Schema.is(CloudQuotaExceededError);
        const isNetworkUnavailable = Schema.is(CloudNetworkUnavailableError);
        const isAccountUnavailable = Schema.is(CloudAccountUnavailableError);

        const resolveFailureStatus = (error: unknown): CloudBackupStatusEnum => {
            if (isQuotaExceeded(error)) {
                return CloudBackupStatusEnum.STORAGE_FULL;
            }

            if (isNetworkUnavailable(error)) {
                return CloudBackupStatusEnum.NETWORK_UNAVAILABLE;
            }

            return isAccountUnavailable(error) ? CloudBackupStatusEnum.ACCOUNT_UNAVAILABLE : CloudBackupStatusEnum.READY;
        };

        return {
            backup: (minimumAgeMilliseconds: number) =>
                runningBackup
                    .withPermitsIfAvailable(1)(runBackup(minimumAgeMilliseconds))
                    .pipe(
                        Effect.map(Option.getOrElse(() => false)),
                        Effect.tap(isUploaded =>
                            isUploaded
                                ? Effect.sync(() => void appAtomRegistry.set(cloudBackupStatusAtom, CloudBackupStatusEnum.READY))
                                : Effect.void
                        ),
                        Effect.tapError(error =>
                            Effect.sync(() => void appAtomRegistry.set(cloudBackupStatusAtom, resolveFailureStatus(error)))
                        )
                    )
        };
    })
}) {
    static readonly layer = Layer.effect(CloudBackupService, CloudBackupService.make).pipe(
        Layer.provide([
            CloudTransport.layer,
            DatabaseRekeyService.layer,
            SettingsRepository.layer,
            SyncZoneRegistryRepository.layer,
            InstallIdService.layer
        ])
    );
}
