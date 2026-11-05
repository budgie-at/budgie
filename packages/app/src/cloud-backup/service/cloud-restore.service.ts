/* oxlint-disable lingui/no-unlocalized-strings */
import { SettingsRepository } from '@budgie/contracts';
import * as Arr from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File } from 'expo-file-system';

import { isNotEmptyString } from '@rnw-community/shared';

import { DATABASE_DIRECTORY } from '../../@generic/drizzle/constant/database-directory.constant';
import { DATABASE_LOCATION } from '../../@generic/drizzle/constant/database-location.constant';
import { DatabaseRekeyService } from '../../@generic/drizzle/service/database-rekey.service';
import { readDatabaseKey } from '../../@generic/drizzle/utils/read-database-key.util';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { DatabaseImportService } from '../../import/service/database-import.service';
import { RESTORE_SAFETY_FILES } from '../constant/restore-safety-files.constant';
import { discardRestoreSafetyCopy } from '../utils/discard-restore-safety-copy.util';

import { CloudTransport } from './cloud-transport.service';

import type { CloudBackupGroupInterface } from '../interface/cloud-backup-group.interface';

export class CloudRestoreService extends Context.Service<CloudRestoreService>()('@budgie/app/CloudRestoreService', {
    make: Effect.gen(function* () {
        const cloudTransport = yield* CloudTransport;
        const databaseRekeyService = yield* DatabaseRekeyService;
        const databaseImportService = yield* DatabaseImportService;
        const settingsRepository = yield* SettingsRepository;

        const databaseFile = (name: string): File => new File(DATABASE_DIRECTORY, name);

        const deleteIfExists = (file: File): void => {
            if (file.exists) {
                file.delete();
            }
        };

        const deleteStagingFiles = (): void => {
            deleteIfExists(databaseFile(RESTORE_SAFETY_FILES.source));
            deleteIfExists(databaseFile(RESTORE_SAFETY_FILES.target));
        };

        const createSafetyCopy = Effect.fn('CloudRestoreService.createSafetyCopy')(function* (currentKey: string | null) {
            const partial = databaseFile(RESTORE_SAFETY_FILES.partial);

            deleteIfExists(partial);
            yield* databaseRekeyService.exportEncryptedCopy(`${DATABASE_LOCATION}/${RESTORE_SAFETY_FILES.partial}`, currentKey);
            deleteIfExists(databaseFile(RESTORE_SAFETY_FILES.copy));
            yield* Effect.promise(() => partial.move(databaseFile(RESTORE_SAFETY_FILES.copy)));
            databaseFile(RESTORE_SAFETY_FILES.pending).create({ overwrite: true });
        });

        return {
            listBackups: Effect.fn('CloudRestoreService.listBackups')(function* () {
                const backups = yield* cloudTransport.listBackups();
                const datedBackups = backups
                    .map(backup => ({ ...backup, createdAt: new Date(backup.createdAt) }))
                    .filter(backup => Number.isFinite(backup.createdAt.getTime()))
                    .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());

                return Object.values(Arr.groupBy(datedBackups, backup => backup.installId)).map(
                    (installBackups): CloudBackupGroupInterface => ({
                        installId: installBackups[0].installId,
                        deviceName: installBackups[0].deviceName,
                        backups: installBackups.map(({ recordName, createdAt, appVersion }) => ({ recordName, createdAt, appVersion }))
                    })
                );
            }),
            restore: Effect.fn('CloudRestoreService.restore')(
                function* (recordName: string) {
                    const storedKey = yield* readDatabaseKey;
                    const targetKey = isNotEmptyString(storedKey) ? storedKey : null;
                    const { isBiometricEnabled, isPinEnabled, cloudBackupEnabled } = yield* settingsRepository.getSettings();
                    const { fileUri, backupKey } = yield* cloudTransport.downloadBackup(recordName);

                    deleteStagingFiles();
                    yield* Effect.promise(() => new File(fileUri).move(databaseFile(RESTORE_SAFETY_FILES.source)));
                    yield* databaseRekeyService.transcodeDatabaseFile(
                        RESTORE_SAFETY_FILES.source,
                        backupKey,
                        RESTORE_SAFETY_FILES.target,
                        targetKey,
                        {
                            isBiometricEnabled,
                            isPinEnabled,
                            cloudBackupEnabled,
                            isOnboardingCompleted: true,
                            lastCloudBackupAt: null
                        }
                    );

                    const targetUri = databaseFile(RESTORE_SAFETY_FILES.target).uri;

                    if (!(yield* databaseImportService.canOpenBackup(targetUri, targetKey))) {
                        return yield* Effect.die(new Error('The downloaded iCloud backup could not be opened'));
                    }

                    yield* createSafetyCopy(targetKey).pipe(
                        Effect.andThen(databaseImportService.importFromUri(targetUri, targetKey)),
                        Effect.tapError(() => Effect.sync(discardRestoreSafetyCopy)),
                        Effect.tapDefect(() => reloadApp)
                    );
                },
                Effect.ensuring(Effect.sync(deleteStagingFiles))
            )
        };
    })
}) {
    static readonly layer = Layer.effect(CloudRestoreService, CloudRestoreService.make).pipe(
        Layer.provide([CloudTransport.layer, DatabaseRekeyService.layer, DatabaseImportService.layer, SettingsRepository.layer])
    );
}
