import { CloudSyncStateStore } from '@budgie/cloud-sync';
import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import { File } from 'expo-file-system';

import { isNotEmptyArray } from '@rnw-community/shared';

import { DATABASE_DIRECTORY } from '../../@generic/drizzle/constant/database-directory.constant';
import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { REPLACED_DATABASE_PREFIX } from '../../@generic/drizzle/constant/replaced-database-prefix.constant';
import { DatabaseLifecycleOperationEnum } from '../../@generic/drizzle/enum/database-lifecycle-operation.enum';
import { UnsupportedBackupError } from '../../@generic/drizzle/error/unsupported-backup.error';
import { DatabaseLifecycleService } from '../../@generic/drizzle/service/database-lifecycle.service';
import { DatabaseSwapService } from '../../@generic/drizzle/service/database-swap.service';
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
        const databaseSwapService = yield* DatabaseSwapService;
        const cloudSyncStateStore = yield* CloudSyncStateStore;
        const reactivity = yield* Reactivity.Reactivity;
        const probeDatabaseName = 'import-probe.db';
        const tempDatabaseName = 'import-temp.db';
        const tempPath = new File(DATABASE_DIRECTORY, tempDatabaseName).uri;

        const deleteFileIfExists = (path: string): void => {
            const file = new File(path);

            if (file.exists) {
                file.delete();
            }
        };

        const deleteDatabaseFiles = (path: string): void => {
            deleteFileIfExists(`${path}-wal`);
            deleteFileIfExists(`${path}-shm`);
            deleteFileIfExists(path);
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

        const moveDatabaseFiles = (sourcePath: string, destinationPath: string, suffixes: readonly string[]) =>
            Effect.forEach(
                suffixes,
                suffix => {
                    const sourceFile = new File(`${sourcePath}${suffix}`);

                    return sourceFile.exists ? Effect.promise(() => sourceFile.move(new File(`${destinationPath}${suffix}`))) : Effect.void;
                },
                { discard: true }
            );

        const foldIntoSingleFile = Effect.fn('DatabaseImportService.foldIntoSingleFile')(function* (backupPin: string | null) {
            yield* openSqliteClient(tempDatabaseName, backupPin).pipe(
                Effect.flatMap(client => client`PRAGMA journal_mode = DELETE`.raw),
                Effect.scoped,
                Effect.provideService(Reactivity.Reactivity, reactivity),
                Effect.orDie
            );

            if (new File(`${tempPath}-wal`).exists) {
                return yield* Effect.die(new Error('The backup WAL was not folded into the import copy'));
            }
        });

        const replaceFromUri = Effect.fn('DatabaseImportService.replaceFromUri')(function* (sourceUri: string, backupPin: string | null) {
            const destinationPath = new File(DATABASE_DIRECTORY, DB_NAME).uri;
            const movedAsideAt = yield* Clock.currentTimeMillis;
            const swap = { key: backupPin, backupName: `${REPLACED_DATABASE_PREFIX}${movedAsideAt}`, isImport: true };
            const replacedPath = new File(DATABASE_DIRECTORY, swap.backupName).uri;

            yield* aiStorageReplacementService.pauseLongLivedRuntime();
            deleteDatabaseFiles(tempPath);
            yield* Effect.promise(() => new File(sourceUri).copy(new File(tempPath)));
            yield* copyFileIfExists(`${sourceUri}-wal`, `${tempPath}-wal`);
            yield* foldIntoSingleFile(backupPin);
            yield* databaseSwapService.begin(swap);
            yield* databaseLifecycleService.close();
            yield* moveDatabaseFiles(destinationPath, replacedPath, ['', '-wal', '-shm']).pipe(
                Effect.andThen(
                    Effect.promise(() => new File(tempPath).move(new File(destinationPath))).pipe(
                        Effect.andThen(databaseSwapService.commit(swap)),
                        Effect.onError(() =>
                            Effect.sync(() => {
                                deleteDatabaseFiles(destinationPath);
                            })
                        )
                    )
                ),
                Effect.onError(() => moveDatabaseFiles(replacedPath, destinationPath, ['-wal', '-shm', '']))
            );
            yield* databaseSwapService.end.pipe(
                Effect.andThen(
                    Effect.sync(() => {
                        deleteDatabaseFiles(replacedPath);
                    })
                ),
                Effect.catchDefect(() => Effect.void)
            );
        });

        const runImport = Effect.fn('DatabaseImportService.runImport')(function* (pickedUri: string, backupPin: string | null) {
            const sourceUri = yield* resolveBackupFile(pickedUri);
            const previousPin = yield* authService.getPin();
            const previousState = yield* cloudSyncStateStore.read;

            yield* replaceFromUri(sourceUri, backupPin).pipe(
                Effect.onError(() =>
                    cloudSyncStateStore
                        .update(previousState)
                        .pipe(
                            Effect.andThen(authService.persistPin(previousPin)),
                            Effect.andThen(new File(DATABASE_DIRECTORY, DB_NAME).exists ? databaseSwapService.end : Effect.void),
                            Effect.orDie
                        )
                ),
                Effect.ensuring(Effect.sync(() => void deleteDatabaseFiles(tempPath)))
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

                deleteDatabaseFiles(probePath);

                return yield* resolveBackupFile(sourceUri).pipe(
                    Effect.flatMap(backupUri => Effect.promise(() => new File(backupUri).copy(new File(probePath)))),
                    Effect.andThen(readProbeDatabase(backupPin)),
                    Effect.scoped,
                    Effect.catchTags({ DatabaseOpenError: () => Effect.succeed(false), SqlError: () => Effect.succeed(false) }),
                    Effect.ensuring(
                        Effect.sync(() => {
                            deleteDatabaseFiles(probePath);
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
            DatabaseSwapService.layer,
            cloudSyncStateStoreLayer
        ])
    );
}
