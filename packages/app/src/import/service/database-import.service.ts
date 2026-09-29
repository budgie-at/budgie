import * as Effect from 'effect/Effect';
import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { isNotEmptyArray, isNotEmptyString } from '@rnw-community/shared';

import { DB_NAME } from '../../@generic/drizzle/constant/db-name.constant';
import { DatabaseLifecycleOperationEnum } from '../../@generic/drizzle/enum/database-lifecycle-operation.enum';
import { databaseLifecycleService } from '../../@generic/drizzle/service/database-lifecycle.service';
import { reloadApp } from '../../@generic/utils/reload-app.util';
import { aiStorageReplacementService } from '../../ai/service/ai-storage-replacement.service';
import { authService } from '../../auth/service/auth.service';

class DatabaseImportService {
    private static readonly PROBE_DATABASE_NAME = 'import-probe.db';

    readonly importFromUri = Effect.fn('DatabaseImportService.importFromUri')(function* (
        this: DatabaseImportService,
        sourceUri: string,
        backupPin: string | null
    ) {
        yield* databaseLifecycleService.run(DatabaseLifecycleOperationEnum.IMPORT, this.runImport(sourceUri, backupPin));
    });

    readonly canOpenBackup = Effect.fn('DatabaseImportService.canOpenBackup')(function* (
        this: DatabaseImportService,
        sourceUri: string,
        backupPin: string | null
    ) {
        const probePath = `${Paths.cache.uri}/${DatabaseImportService.PROBE_DATABASE_NAME}`;

        this.deleteProbeFiles(probePath);

        return yield* Effect.promise(() => new File(sourceUri).copy(new File(probePath))).pipe(
            Effect.andThen(this.readProbeDatabase(backupPin)),
            Effect.catchDefect(() => Effect.succeed(false)),
            Effect.ensuring(
                Effect.sync(() => {
                    this.deleteProbeFiles(probePath);
                })
            )
        );
    });

    readonly replaceFromUri = Effect.fn('DatabaseImportService.replaceFromUri')(function* (this: DatabaseImportService, sourceUri: string) {
        const destinationPath = this.getDestinationPath();
        const tempPath = `${Paths.cache.uri}/import-temp.db`;

        yield* aiStorageReplacementService.pauseLongLivedRuntime();
        yield* databaseLifecycleService.close();
        this.deleteDestinationFiles(destinationPath, tempPath);
        yield* this.replaceDestinationFile(sourceUri, tempPath, destinationPath);
        yield* this.copyDatabaseSidecars(sourceUri, destinationPath);
    });

    private readonly runImport = Effect.fn('DatabaseImportService.runImport')(function* (
        this: DatabaseImportService,
        sourceUri: string,
        backupPin: string | null
    ) {
        const previousPin = yield* authService.getPin();

        yield* authService.persistPin(backupPin);
        yield* this.replaceFromUri(sourceUri).pipe(Effect.onError(() => authService.persistPin(previousPin)));
        yield* Effect.promise(() => reloadApp());
    });

    private readonly readProbeDatabase = Effect.fn('DatabaseImportService.readProbeDatabase')(function* (backupPin: string | null) {
        return yield* Effect.acquireUseRelease(
            Effect.promise(() =>
                SQLite.openDatabaseAsync(DatabaseImportService.PROBE_DATABASE_NAME, { useNewConnection: true }, Paths.cache.uri)
            ),
            probeDatabase =>
                Effect.gen(function* () {
                    if (isNotEmptyString(backupPin)) {
                        yield* Effect.promise(() => probeDatabase.execAsync(`PRAGMA key = '${backupPin}';`)); // oxlint-disable-line lingui/no-unlocalized-strings
                    }

                    // oxlint-disable-next-line lingui/no-unlocalized-strings
                    const tables = yield* Effect.promise(() => probeDatabase.getAllAsync<unknown>('SELECT name FROM sqlite_master;'));

                    return isNotEmptyArray(tables);
                }),
            probeDatabase => Effect.promise(() => probeDatabase.closeAsync())
        );
    });

    private readonly replaceDestinationFile = Effect.fn('DatabaseImportService.replaceDestinationFile')(function* (
        sourceUri: string,
        tempPath: string,
        destinationPath: string
    ) {
        const tempFile = new File(tempPath);

        yield* Effect.promise(() => new File(sourceUri).copy(tempFile));
        yield* Effect.promise(() => tempFile.move(new File(destinationPath)));
    });

    private readonly copyDatabaseSidecars = Effect.fn('DatabaseImportService.copyDatabaseSidecars')(function* (
        this: DatabaseImportService,
        sourceUri: string,
        destinationPath: string
    ) {
        yield* this.copyFileIfExists(`${sourceUri}-wal`, `${destinationPath}-wal`).pipe(
            Effect.andThen(this.copyFileIfExists(`${sourceUri}-shm`, `${destinationPath}-shm`)),
            Effect.catchDefect(() =>
                Effect.sync(() => {
                    this.deleteFileIfExists(`${destinationPath}-wal`);
                    this.deleteFileIfExists(`${destinationPath}-shm`);
                })
            )
        );
    });

    private readonly copyFileIfExists = Effect.fnUntraced(function* (sourcePath: string, destinationPath: string) {
        const sourceFile = new File(sourcePath);

        if (sourceFile.exists) {
            yield* Effect.promise(() => sourceFile.copy(new File(destinationPath)));
        }
    });

    private deleteProbeFiles(probePath: string): void {
        this.deleteFileIfExists(probePath);
        this.deleteFileIfExists(`${probePath}-wal`);
        this.deleteFileIfExists(`${probePath}-shm`);
    }

    private deleteDestinationFiles(destinationPath: string, tempPath: string): void {
        this.deleteFileIfExists(destinationPath);
        this.deleteFileIfExists(`${destinationPath}-wal`);
        this.deleteFileIfExists(`${destinationPath}-shm`);
        this.deleteFileIfExists(tempPath);
    }

    private deleteFileIfExists(path: string): void {
        const file = new File(path);

        if (file.exists) {
            file.delete();
        }
    }

    private getDestinationPath(): string {
        return `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;
    }
}

export const databaseImportService = new DatabaseImportService();
