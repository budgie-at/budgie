import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import Storage from 'expo-sqlite/kv-store';

import { getErrorMessage, isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { DatabaseLifecycleOperationEnum } from '../../@generic/drizzle/enum/database-lifecycle-operation.enum';
import { DatabaseLifecycleService } from '../../@generic/drizzle/service/database-lifecycle.service';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { EMBEDDING_MODEL_STORAGE_KEY } from '../../ai/constant/embedding-model-storage-key.constant';
import { AiStorageReplacementService } from '../../ai/service/ai-storage-replacement.service';
import { AuthService } from '../../auth/service/auth.service';

export class DatabaseImportService extends Context.Service<DatabaseImportService>()('@budgie/app/DatabaseImportService', {
    make: Effect.gen(function* () {
        const databaseLifecycleService = yield* DatabaseLifecycleService;
        const aiStorageReplacementService = yield* AiStorageReplacementService;
        const authService = yield* AuthService;
        const probeDatabaseName = 'import-probe.db';
        const notADatabasePattern = /not a database/iu;

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

        const deleteDestinationFiles = (destinationPath: string, tempPath: string): void => {
            deleteFileIfExists(destinationPath);
            deleteFileIfExists(`${destinationPath}-wal`);
            deleteFileIfExists(`${destinationPath}-shm`);
            deleteFileIfExists(tempPath);
        };

        const readProbeDatabase = Effect.fn('DatabaseImportService.readProbeDatabase')(function* (backupPin: string | null) {
            return yield* Effect.acquireUseRelease(
                Effect.promise(() => SQLite.openDatabaseAsync(probeDatabaseName, { useNewConnection: true }, Paths.cache.uri)),
                probeDatabase =>
                    Effect.gen(function* () {
                        if (isNotEmptyString(backupPin)) {
                            yield* Effect.promise(() => probeDatabase.execAsync(`PRAGMA key = '${backupPin}';`)); // oxlint-disable-line lingui/no-unlocalized-strings
                        }

                        const tables = yield* Effect.promise(() =>
                            // oxlint-disable-next-line lingui/no-unlocalized-strings
                            probeDatabase.getAllAsync<unknown>('SELECT name FROM sqlite_master;')
                        );

                        return isNotEmptyArray(tables);
                    }),
                probeDatabase => Effect.tryPromise(() => probeDatabase.closeAsync()).pipe(Effect.ignore)
            );
        });

        const replaceDestinationFile = Effect.fn('DatabaseImportService.replaceDestinationFile')(function* (
            sourceUri: string,
            tempPath: string,
            destinationPath: string
        ) {
            const tempFile = new File(tempPath);

            yield* Effect.promise(() => new File(sourceUri).copy(tempFile));
            yield* Effect.promise(() => tempFile.move(new File(destinationPath)));
        });

        const copyFileIfExists = Effect.fnUntraced(function* (sourcePath: string, destinationPath: string) {
            const sourceFile = new File(sourcePath);

            if (sourceFile.exists) {
                yield* Effect.promise(() => sourceFile.copy(new File(destinationPath)));
            }
        });

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
            const destinationPath = `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;
            const tempPath = `${Paths.cache.uri}/import-temp.db`;

            yield* aiStorageReplacementService.pauseLongLivedRuntime();
            yield* databaseLifecycleService.close();
            deleteDestinationFiles(destinationPath, tempPath);
            yield* replaceDestinationFile(sourceUri, tempPath, destinationPath);
            yield* copyDatabaseSidecars(sourceUri, destinationPath);
        });

        const runImport = Effect.fn('DatabaseImportService.runImport')(function* (sourceUri: string, backupPin: string | null) {
            const previousPin = yield* authService.getPin();

            yield* authService.persistPin(backupPin);
            yield* replaceFromUri(sourceUri).pipe(Effect.onError(() => authService.persistPin(previousPin).pipe(Effect.orDie)));
            yield* Effect.promise(() => Storage.removeItem(EMBEDDING_MODEL_STORAGE_KEY));
            yield* Effect.promise(() => reloadApp());
        });

        return {
            importFromUri: Effect.fn('DatabaseImportService.importFromUri')(function* (sourceUri: string, backupPin: string | null) {
                yield* databaseLifecycleService.run(DatabaseLifecycleOperationEnum.IMPORT, runImport(sourceUri, backupPin));
            }),
            canOpenBackup: Effect.fn('DatabaseImportService.canOpenBackup')(function* (sourceUri: string, backupPin: string | null) {
                const probePath = `${Paths.cache.uri}/${probeDatabaseName}`;

                deleteProbeFiles(probePath);

                return yield* Effect.promise(() => new File(sourceUri).copy(new File(probePath))).pipe(
                    Effect.andThen(readProbeDatabase(backupPin)),
                    Effect.catchDefect(defect =>
                        notADatabasePattern.test(getErrorMessage(defect)) ? Effect.succeed(false) : Effect.die(defect)
                    ),
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
        Layer.provide([DatabaseLifecycleService.layer, AiStorageReplacementService.layer, AuthService.layer])
    );
}
