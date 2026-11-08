import { CloudSyncTransportError, ICloudErrorCode, ICloudAccountStatusEnum, buildHouseholdRemovalStatements } from '@budgie/cloud-sync';
import {
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
import { deleteIfExists } from '../../@generic/utils/delete-if-exists.util';
import { cloudBackupStatusAtom } from '../constant/cloud-backup-status-atom.constant';
import { CloudBackupStatusEnum } from '../enum/cloud-backup-status.enum';

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
        const LastChangedRowsSchema = Schema.NonEmptyArray(
            Schema.Struct({ lastChangedAt: Schema.NullOr(Schema.Finite), rowCount: Schema.Finite })
        );
        const lastChangedAtSql = String.raw`SELECT MAX(lastChangedAt) AS lastChangedAt, SUM(rowCount) AS rowCount FROM (${Object.values(
            schema
        )
            .map(table => getTableConfig(table))
            .flatMap(config =>
                userDataTableNames.has(config.name)
                    ? [
                          String.raw`SELECT NULL AS lastChangedAt, COUNT(*) AS rowCount FROM ${config.name}`,
                          ...config.columns
                              .filter(column => timestampColumnNames.has(column.name))
                              .map(column => String.raw`SELECT MAX(${column.name}) AS lastChangedAt, 0 AS rowCount FROM ${config.name}`)
                      ]
                    : []
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

        const applyRetention = Effect.fn('CloudBackupService.applyRetention')(function* (installId: string) {
            const backups = yield* cloudTransport.listBackups;
            const now = yield* Clock.currentTimeMillis;
            const recordNames = selectBackupsToDelete(backups, installId, now);

            if (isNotEmptyArray(recordNames)) {
                yield* cloudTransport.deleteBackups(recordNames);
            }
        });

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
                    deleteIfExists(temporaryFile);
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
                        deleteIfExists(temporaryFile);
                    })
            );

            return installId;
        });

        const runBackup = Effect.fn('CloudBackupService.runBackup')(function* (minimumAgeMilliseconds: number) {
            const settings = yield* settingsRepository.getSettings();
            const startedAt = yield* DateTime.nowAsDate;

            if (!settings.cloudBackupEnabled) {
                return null;
            }

            if (
                isDefined(settings.lastCloudBackupAt) &&
                startedAt.getTime() - settings.lastCloudBackupAt.getTime() < minimumAgeMilliseconds
            ) {
                return null;
            }

            const rows = yield* Db.query(db => db.$client.unsafe(lastChangedAtSql));
            const [{ lastChangedAt, rowCount }] = yield* Schema.decodeUnknownEffect(LastChangedRowsSchema)(rows);
            const hasTimestampChanged =
                isDefined(lastChangedAt) && lastChangedAt >= Math.floor((settings.lastCloudBackupAt?.getTime() ?? 0) / 1000);

            if (!hasTimestampChanged && rowCount === settings.lastCloudBackupRowCount) {
                return null;
            }

            if ((yield* cloudTransport.getAccountStatus).status !== ICloudAccountStatusEnum.AVAILABLE) {
                return null;
            }

            const installId = yield* uploadBackup(startedAt);

            yield* settingsRepository.update({ lastCloudBackupAt: startedAt, lastCloudBackupRowCount: rowCount });

            return installId;
        });

        const isTransportError = Schema.is(CloudSyncTransportError);

        const resolveFailureStatus = (error: unknown): CloudBackupStatusEnum => {
            if (isTransportError(error) && error.code === ICloudErrorCode.QUOTA_EXCEEDED) {
                return CloudBackupStatusEnum.STORAGE_FULL;
            }

            if (isTransportError(error) && error.code === ICloudErrorCode.NETWORK_UNAVAILABLE) {
                return CloudBackupStatusEnum.NETWORK_UNAVAILABLE;
            }

            return isTransportError(error) && error.code === ICloudErrorCode.ACCOUNT_UNAVAILABLE
                ? CloudBackupStatusEnum.ACCOUNT_UNAVAILABLE
                : CloudBackupStatusEnum.READY;
        };

        return {
            backup: (minimumAgeMilliseconds: number) =>
                runningBackup
                    .withPermitsIfAvailable(1)(runBackup(minimumAgeMilliseconds))
                    .pipe(
                        Effect.map(Option.getOrElse(() => null)),
                        Effect.tap(() => Effect.sync(() => void appAtomRegistry.set(cloudBackupStatusAtom, CloudBackupStatusEnum.READY))),
                        Effect.tapError(error =>
                            Effect.sync(() => void appAtomRegistry.set(cloudBackupStatusAtom, resolveFailureStatus(error)))
                        ),
                        Effect.tap(installId => (isDefined(installId) ? applyRetention(installId) : Effect.void)),
                        Effect.map(isDefined)
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
