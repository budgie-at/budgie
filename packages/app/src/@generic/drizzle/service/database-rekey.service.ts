/* oxlint-disable lingui/no-unlocalized-strings */
import { Db, makeEffectSqliteClientDatabase, SettingsRepository } from '@budgie/contracts';
import { withReplicas } from 'drizzle-orm/sqlite-core/effect';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { identity } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import { File } from 'expo-file-system';

import { DATABASE_DIRECTORY } from '../constant/database-directory.constant';
import { DATABASE_LOCATION } from '../constant/database-location.constant';
import { DB_NAME } from '../constant/db-name.constant';
import { openSqliteClient } from '../utils/open-sqlite-client.util';

import { DatabaseLifecycleService } from './database-lifecycle.service';
import { RekeyParamsInterface } from './interface/rekey-params.interface';
import { RekeyPathsInterface } from './interface/rekey-paths.interface';

export class DatabaseRekeyService extends Context.Service<DatabaseRekeyService>()('@budgie/app/DatabaseRekeyService', {
    make: Effect.gen(function* () {
        const databaseLifecycleService = yield* DatabaseLifecycleService;
        const settingsRepository = yield* SettingsRepository;
        const reactivity = yield* Reactivity.Reactivity;

        const deleteFileIfExists = (uri: string): void => {
            const file = new File(uri);

            if (file.exists) {
                file.delete();
            }
        };

        const deleteDatabaseFiles = (databaseUri: string): void => {
            deleteFileIfExists(databaseUri);
            deleteFileIfExists(`${databaseUri}-wal`);
            deleteFileIfExists(`${databaseUri}-shm`);
        };

        const escapeSqlString = (value: string): string => value.replaceAll("'", "''");

        const getPaths = (): RekeyPathsInterface => {
            const tempDatabaseName = 'auth-migration.db';
            const destinationUri = new File(DATABASE_DIRECTORY, DB_NAME).uri;

            return {
                tempDatabaseName,
                tempDatabaseUri: new File(DATABASE_DIRECTORY, tempDatabaseName).uri,
                destinationUri,
                backupUri: `${destinationUri}.bak`
            };
        };

        const moveFile = Effect.fnUntraced(function* (sourceUri: string, destinationUri: string) {
            yield* Effect.promise(() => new File(sourceUri).move(new File(destinationUri)));
        });

        const exportDatabase = Effect.fn('DatabaseRekeyService.exportDatabase')(function* (
            tempDatabaseName: string,
            nextKey: string | null
        ) {
            const { $client: client } = yield* Db;

            yield* client.unsafe('PRAGMA wal_checkpoint(FULL)').raw;
            yield* client.unsafe(
                `ATTACH DATABASE '${escapeSqlString(`${DATABASE_LOCATION}/${tempDatabaseName}`)}' AS migrated KEY '${escapeSqlString(nextKey ?? '')}'`
            ).raw;
            yield* client
                .unsafe('PRAGMA migrated.journal_mode = DELETE')
                .raw.pipe(
                    Effect.andThen(client.unsafe(`SELECT sqlcipher_export('migrated')`).raw),
                    Effect.ensuring(Effect.ignore(client.unsafe('DETACH DATABASE migrated').raw))
                );
        });

        const updateMigratedDatabaseSettings = Effect.fn('DatabaseRekeyService.updateMigratedDatabaseSettings')(function* (
            tempDatabaseName: string,
            nextKey: string | null,
            nextSettings: NonNullable<RekeyParamsInterface['nextSettings']>
        ) {
            const client = yield* openSqliteClient(tempDatabaseName, nextKey).pipe(
                Effect.provideService(Reactivity.Reactivity, reactivity)
            );
            const database = yield* makeEffectSqliteClientDatabase(client, { onMutate: () => Effect.void, runQuery: identity });

            yield* settingsRepository.update(nextSettings).pipe(Effect.provideService(Db, withReplicas(database, [database])));
        }, Effect.scoped);

        const prepare = Effect.fn('DatabaseRekeyService.prepare')(function* (paths: RekeyPathsInterface, params: RekeyParamsInterface) {
            deleteDatabaseFiles(paths.tempDatabaseUri);
            deleteDatabaseFiles(paths.backupUri);
            yield* exportDatabase(paths.tempDatabaseName, params.nextKey);

            if (params.nextSettings) {
                yield* updateMigratedDatabaseSettings(paths.tempDatabaseName, params.nextKey, params.nextSettings);
            }
        });

        const commit = Effect.fn('DatabaseRekeyService.commit')(function* (paths: RekeyPathsInterface, onCommit: Effect.Effect<void>) {
            yield* databaseLifecycleService.close();
            deleteFileIfExists(`${paths.destinationUri}-wal`);
            deleteFileIfExists(`${paths.destinationUri}-shm`);
            if (new File(paths.destinationUri).exists) {
                yield* moveFile(paths.destinationUri, paths.backupUri);
            }
            yield* moveFile(paths.tempDatabaseUri, paths.destinationUri);
            yield* onCommit;
            deleteDatabaseFiles(paths.backupUri);
        });

        const restoreBackupDatabase = Effect.fn('DatabaseRekeyService.restoreBackupDatabase')(function* (paths: RekeyPathsInterface) {
            if (!new File(paths.backupUri).exists) {
                return;
            }

            deleteDatabaseFiles(paths.destinationUri);
            yield* moveFile(paths.backupUri, paths.destinationUri);
        });

        return {
            rekey: Effect.fn('DatabaseRekeyService.rekey')(function* (params: RekeyParamsInterface, onCommit: Effect.Effect<void>) {
                const paths = getPaths();

                yield* prepare(paths, params).pipe(
                    Effect.andThen(commit(paths, onCommit).pipe(Effect.onError(() => restoreBackupDatabase(paths)))),
                    Effect.ensuring(
                        Effect.sync(() => {
                            deleteDatabaseFiles(paths.tempDatabaseUri);
                        })
                    )
                );
            })
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseRekeyService, DatabaseRekeyService.make).pipe(
        Layer.provide([DatabaseLifecycleService.layer, SettingsRepository.layer])
    );
}
