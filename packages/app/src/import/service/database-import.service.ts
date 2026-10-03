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
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { AiEmbeddingStatusService } from '../../ai/service/ai-embedding-status.service';
import { AiStorageReplacementService } from '../../ai/service/ai-storage-replacement.service';
import { AuthService } from '../../auth/service/auth.service';

export class DatabaseImportService extends Context.Service<DatabaseImportService>()('@budgie/app/DatabaseImportService', {
    make: Effect.gen(function* () {
        const databaseLifecycleService = yield* DatabaseLifecycleService;
        const aiStorageReplacementService = yield* AiStorageReplacementService;
        const aiEmbeddingStatusService = yield* AiEmbeddingStatusService;
        const authService = yield* AuthService;
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

        const deleteDestinationFiles = (destinationPath: string, tempPath: string): void => {
            deleteFileIfExists(destinationPath);
            deleteFileIfExists(`${destinationPath}-wal`);
            deleteFileIfExists(`${destinationPath}-shm`);
            deleteFileIfExists(tempPath);
        };

        const readProbeDatabase = Effect.fn('DatabaseImportService.readProbeDatabase')(function* (backupPin: string | null) {
            const probeClient = yield* openSqliteClient(probeDatabaseName, backupPin);

            if (!isNotEmptyArray(yield* probeClient`SELECT name FROM sqlite_master`)) {
                return false;
            }

            if (!isSupportedMigrationCreatedAt(yield* readLastMigrationCreatedAt(probeClient))) {
                return yield* new UnsupportedBackupError();
            }

            return true;
        }, Effect.scoped);

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
            const destinationPath = new File(DATABASE_DIRECTORY, DB_NAME).uri;
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
            yield* aiEmbeddingStatusService.forgetModel();
            yield* Effect.promise(() => reloadApp());
        });

        return {
            importFromUri: Effect.fn('DatabaseImportService.importFromUri')(function* (sourceUri: string, backupPin: string | null) {
                yield* databaseLifecycleService.run(DatabaseLifecycleOperationEnum.IMPORT, runImport(sourceUri, backupPin));
            }),
            canOpenBackup: Effect.fn('DatabaseImportService.canOpenBackup')(function* (sourceUri: string, backupPin: string | null) {
                const probePath = new File(DATABASE_DIRECTORY, probeDatabaseName).uri;

                deleteProbeFiles(probePath);

                return yield* Effect.promise(() => new File(sourceUri).copy(new File(probePath))).pipe(
                    Effect.andThen(readProbeDatabase(backupPin)),
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
            AuthService.layer
        ])
    );
}
