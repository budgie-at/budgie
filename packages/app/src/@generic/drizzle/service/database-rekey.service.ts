/* oxlint-disable lingui/no-unlocalized-strings */
import { Db, SettingsRepository } from '@budgie/contracts';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import { isNotEmptyString } from '@rnw-community/shared';

import { DB_NAME } from '../constant/db-name.constant';
import { expoDb } from '../db/db';
import * as schema from '../db/schema';

import { DatabaseLifecycleService } from './database-lifecycle.service';
import { RekeyParamsInterface } from './interface/rekey-params.interface';
import { RekeyPathsInterface } from './interface/rekey-paths.interface';

export class DatabaseRekeyService extends Context.Service<DatabaseRekeyService>()('@budgie/app/DatabaseRekeyService', {
    make: Effect.gen(function* () {
        const databaseLifecycleService = yield* DatabaseLifecycleService;
        const settingsRepository = yield* SettingsRepository;

        const deleteFileIfExists = (path: string): void => {
            const file = new File(path);

            if (file.exists) {
                file.delete();
            }
        };

        const deleteDatabaseFiles = (databasePath: string): void => {
            deleteFileIfExists(databasePath);
            deleteFileIfExists(`${databasePath}-wal`);
            deleteFileIfExists(`${databasePath}-shm`);
        };

        const escapeSqlString = (value: string): string => value.replaceAll("'", "''");

        const getPaths = (): RekeyPathsInterface => {
            const tempDatabaseName = 'auth-migration.db';
            const destinationPath = `${String(SQLite.defaultDatabaseDirectory)}/${DB_NAME}`;

            return {
                tempDatabaseName,
                tempDatabasePath: `${Paths.cache.uri}/${tempDatabaseName}`,
                destinationPath,
                backupPath: `${destinationPath}.bak`
            };
        };

        const moveFile = Effect.fnUntraced(function* (sourcePath: string, destinationPath: string) {
            yield* Effect.promise(() => new File(sourcePath).move(new File(destinationPath)));
        });

        const exportDatabase = Effect.fn('DatabaseRekeyService.exportDatabase')(function* (
            tempDatabasePath: string,
            nextKey: string | null
        ) {
            yield* Effect.promise(() => expoDb.execAsync('PRAGMA wal_checkpoint(FULL)'));
            yield* Effect.promise(() => expoDb.execAsync('PRAGMA journal_mode = DELETE'));
            yield* Effect.promise(() =>
                expoDb.execAsync(
                    `ATTACH DATABASE '${escapeSqlString(tempDatabasePath)}' AS migrated KEY '${escapeSqlString(nextKey ?? '')}';`
                )
            );
            yield* Effect.promise(() => expoDb.execAsync(`SELECT sqlcipher_export('migrated');`)).pipe(
                Effect.ensuring(Effect.promise(() => expoDb.execAsync('DETACH DATABASE migrated;')))
            );
        });

        const writeMigratedDatabaseSettings = Effect.fn('DatabaseRekeyService.writeMigratedDatabaseSettings')(function* (
            tempDatabase: SQLite.SQLiteDatabase,
            nextKey: string | null,
            nextSettings: NonNullable<RekeyParamsInterface['nextSettings']>
        ) {
            if (isNotEmptyString(nextKey)) {
                yield* Effect.promise(() => tempDatabase.execAsync(`PRAGMA key = '${escapeSqlString(nextKey)}';`));
            }

            yield* settingsRepository.update(nextSettings).pipe(Effect.provideService(Db, drizzle(tempDatabase, { schema })));
        });

        const updateMigratedDatabaseSettings = Effect.fn('DatabaseRekeyService.updateMigratedDatabaseSettings')(function* (
            tempDatabaseName: string,
            nextKey: string | null,
            nextSettings: NonNullable<RekeyParamsInterface['nextSettings']>
        ) {
            yield* Effect.acquireUseRelease(
                Effect.promise(() => SQLite.openDatabaseAsync(tempDatabaseName, { enableChangeListener: true }, Paths.cache.uri)),
                tempDatabase => writeMigratedDatabaseSettings(tempDatabase, nextKey, nextSettings),
                tempDatabase => Effect.promise(() => tempDatabase.closeAsync())
            );
        });

        const prepare = Effect.fn('DatabaseRekeyService.prepare')(function* (paths: RekeyPathsInterface, params: RekeyParamsInterface) {
            deleteDatabaseFiles(paths.tempDatabasePath);
            deleteDatabaseFiles(paths.backupPath);
            yield* exportDatabase(paths.tempDatabasePath, params.nextKey);

            if (params.nextSettings) {
                yield* updateMigratedDatabaseSettings(paths.tempDatabaseName, params.nextKey, params.nextSettings);
            }
        });

        const commit = Effect.fn('DatabaseRekeyService.commit')(function* (paths: RekeyPathsInterface, onCommit: Effect.Effect<void>) {
            yield* databaseLifecycleService.close();
            deleteFileIfExists(`${paths.destinationPath}-wal`);
            deleteFileIfExists(`${paths.destinationPath}-shm`);
            if (new File(paths.destinationPath).exists) {
                yield* moveFile(paths.destinationPath, paths.backupPath);
            }
            yield* moveFile(paths.tempDatabasePath, paths.destinationPath);
            yield* onCommit;
            deleteDatabaseFiles(paths.backupPath);
        });

        const restoreBackupDatabase = Effect.fn('DatabaseRekeyService.restoreBackupDatabase')(function* (paths: RekeyPathsInterface) {
            if (!new File(paths.backupPath).exists) {
                return;
            }

            deleteDatabaseFiles(paths.destinationPath);
            yield* moveFile(paths.backupPath, paths.destinationPath);
        });

        return {
            rekey: Effect.fn('DatabaseRekeyService.rekey')(function* (params: RekeyParamsInterface, onCommit: Effect.Effect<void>) {
                const paths = getPaths();

                yield* prepare(paths, params).pipe(
                    Effect.andThen(commit(paths, onCommit).pipe(Effect.onError(() => restoreBackupDatabase(paths)))),
                    Effect.ensuring(Effect.sync(() => deleteDatabaseFiles(paths.tempDatabasePath)))
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseRekeyService, DatabaseRekeyService.make).pipe(
        Layer.provide([DatabaseLifecycleService.layer, SettingsRepository.layer])
    );
}
