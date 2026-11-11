import { CloudSyncRestorePhaseEnum, CloudSyncStateStore } from '@budgie/cloud-sync';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File, Paths } from 'expo-file-system';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DATABASE_DIRECTORY } from '../../@generic/drizzle/constant/database-directory.constant';
import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { DatabaseLifecycleOperationEnum } from '../../@generic/drizzle/enum/database-lifecycle-operation.enum';
import { UnsupportedBackupError } from '../../@generic/drizzle/error/unsupported-backup.error';
import { DatabaseLifecycleService } from '../../@generic/drizzle/service/database-lifecycle.service';
import { isSupportedMigrationCreatedAt } from '../../@generic/drizzle/utils/is-supported-migration-created-at.util';
import { openSqliteClient } from '../../@generic/drizzle/utils/open-sqlite-client.util';
import { readLastMigrationCreatedAt } from '../../@generic/drizzle/utils/read-last-migration-created-at.util';
import { resolveBackupFile } from '../../@generic/drizzle/utils/resolve-backup-file.util';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { AiEmbeddingStatusService } from '../../ai/service/ai-embedding-status.service';
import { AiStorageReplacementService } from '../../ai/service/ai-storage-replacement.service';
import { AuthService } from '../../auth/service/auth.service';
import { cloudSyncStateStoreLayer } from '../../cloud-sync/layer/cloud-sync-state-store.layer';

export class DatabaseImportService extends Context.Service<DatabaseImportService>()('@budgie/app/DatabaseImportService', {
    make: Effect.gen(function* () {
        const databaseLifecycleService = yield* DatabaseLifecycleService;
        const aiStorageReplacementService = yield* AiStorageReplacementService;
        const aiEmbeddingStatusService = yield* AiEmbeddingStatusService;
        const authService = yield* AuthService;
        const cloudSyncStateStore = yield* CloudSyncStateStore;
        const probeDatabaseName = 'import-probe.db';

        const deleteFileIfExists = (path: string): void => {
            const file = new File(path);

            if (file.exists) {
                file.delete();
            }
        };

        const deleteProbeFiles = (probePath: string): void => {
            deleteFileIfExists(probePath);
            deleteFileIfExists(`${probePath}-wal`);
            deleteFileIfExists(`${probePath}-shm`);
        };

        const readProbeDatabase = Effect.fn('DatabaseImportService.readProbeDatabase')(function* (backupPin: string | null) {
            const probeClient = yield* openSqliteClient(probeDatabaseName, backupPin);

            const tables = yield* probeClient`SELECT name FROM sqlite_master`;

            if (!isNotEmptyArray(tables)) {
                return false;
            }

            const lastCreatedAt = yield* readLastMigrationCreatedAt(probeClient);

            if (!isSupportedMigrationCreatedAt(lastCreatedAt)) {
                return yield* UnsupportedBackupError.make();
            }

            return true;
        }, Effect.scoped);

        const copyFileIfExists = Effect.fnUntraced(function* (sourcePath: string, destinationPath: string) {
            const sourceFile = new File(sourcePath);

            if (sourceFile.exists) {
                yield* Effect.promise(() => sourceFile.copy(new File(destinationPath)));
            }
        });

        const moveDatabaseFiles = (sourcePath: string, destinationPath: string) =>
            Effect.forEach(
                ['', '-wal', '-shm'],
                suffix => {
                    const sourceFile = new File(`${sourcePath}${suffix}`);

                    return sourceFile.exists ? Effect.promise(() => sourceFile.move(new File(`${destinationPath}${suffix}`))) : Effect.void;
                },
                { discard: true }
            );

        const copyDatabaseSidecars = Effect.fn('DatabaseImportService.copyDatabaseSidecars')(function* (
            sourceUri: string,
            destinationPath: string
        ) {
            yield* copyFileIfExists(`${sourceUri}-wal`, `${destinationPath}-wal`).pipe(
                Effect.andThen(copyFileIfExists(`${sourceUri}-shm`, `${destinationPath}-shm`)),
                Effect.catchDefect(() =>
                    Effect.sync(() => {
                        deleteFileIfExists(`${destinationPath}-wal`);
                        deleteFileIfExists(`${destinationPath}-shm`);
                    })
                )
            );
        });

        const replaceFromUri = Effect.fn('DatabaseImportService.replaceFromUri')(function* (sourceUri: string) {
            const destinationPath = new File(DATABASE_DIRECTORY, DB_NAME).uri;
            const replacedPath = `${destinationPath}.replaced`;
            const tempPath = `${Paths.cache.uri}/import-temp.db`;

            yield* aiStorageReplacementService.pauseLongLivedRuntime();
            deleteFileIfExists(tempPath);
            deleteProbeFiles(replacedPath);
            yield* Effect.promise(() => new File(sourceUri).copy(new File(tempPath)));
            yield* databaseLifecycleService.close();
            yield* moveDatabaseFiles(destinationPath, replacedPath).pipe(
                Effect.andThen(
                    Effect.promise(() => new File(tempPath).move(new File(destinationPath))).pipe(
                        Effect.andThen(copyDatabaseSidecars(sourceUri, destinationPath)),
                        Effect.onError(() =>
                            Effect.sync(() => {
                                deleteProbeFiles(destinationPath);
                            })
                        )
                    )
                ),
                Effect.onError(() => moveDatabaseFiles(replacedPath, destinationPath))
            );
            deleteProbeFiles(replacedPath);
        });

        const runImport = Effect.fn('DatabaseImportService.runImport')(function* (pickedUri: string, backupPin: string | null) {
            const sourceUri = yield* resolveBackupFile(pickedUri);
            const previousPin = yield* authService.getPin();
            const previousState = yield* cloudSyncStateStore.read;

            yield* cloudSyncStateStore.update({
                stateSerialization: null,
                resolvedLineageId: null,
                restorePhase: CloudSyncRestorePhaseEnum.PENDING
            });
            yield* authService.persistPin(backupPin);
            yield* replaceFromUri(sourceUri).pipe(
                Effect.onError(() =>
                    new File(DATABASE_DIRECTORY, DB_NAME).exists
                        ? cloudSyncStateStore.update(previousState).pipe(Effect.andThen(authService.persistPin(previousPin)), Effect.orDie)
                        : Effect.void
                ),
                Effect.ensuring(Effect.sync(() => void deleteFileIfExists(`${Paths.cache.uri}/import-temp.db`)))
            );
        }, Effect.scoped);

        return {
            importFromUri: Effect.fn('DatabaseImportService.importFromUri')(function* (sourceUri: string, backupPin: string | null) {
                yield* databaseLifecycleService.run(
                    DatabaseLifecycleOperationEnum.IMPORT,
                    runImport(sourceUri, backupPin).pipe(Effect.andThen(aiEmbeddingStatusService.forgetModel), Effect.andThen(reloadApp))
                );
            }),
            canOpenBackup: Effect.fn('DatabaseImportService.canOpenBackup')(function* (sourceUri: string, backupPin: string | null) {
                const probePath = new File(DATABASE_DIRECTORY, probeDatabaseName).uri;

                deleteProbeFiles(probePath);

                return yield* resolveBackupFile(sourceUri).pipe(
                    Effect.flatMap(backupUri => Effect.promise(() => new File(backupUri).copy(new File(probePath)))),
                    Effect.andThen(readProbeDatabase(backupPin)),
                    Effect.scoped,
                    Effect.catchTags({ DatabaseOpenError: () => Effect.succeed(false), SqlError: () => Effect.succeed(false) }),
                    Effect.ensuring(
                        Effect.sync(() => {
                            deleteProbeFiles(probePath);
                        })
                    )
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseImportService, DatabaseImportService.make).pipe(
        Layer.provide([
            DatabaseLifecycleService.layer,
            AiStorageReplacementService.layer,
            AiEmbeddingStatusService.layer,
            AuthService.layer,
            cloudSyncStateStoreLayer
        ])
    );
}
