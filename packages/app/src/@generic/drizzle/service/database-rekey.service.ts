/* oxlint-disable lingui/no-unlocalized-strings */
import { Db, makeEffectSqliteClientDatabase, SettingsCreateEntityInterface, SettingsRepository } from '@budgie/contracts';
import { withReplicas } from 'drizzle-orm/sqlite-core/effect';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { identity } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Schema from 'effect/Schema';
import { File } from 'expo-file-system';

import { DATABASE_DIRECTORY } from '../constant/database-directory.constant';
import { DATABASE_LOCATION } from '../constant/database-location.constant';
import { DB_NAME } from '../constant/db-name.constant';
import { openSqliteClient } from '../utils/open-sqlite-client.util';

import { DatabaseLifecycleService } from './database-lifecycle.service';
import { RekeyParamsInterface } from './interface/rekey-params.interface';

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

        const RandomKeyRowsSchema = Schema.NonEmptyArray(Schema.Struct({ key: Schema.String }));
        const escapeSqlString = (value: string): string => value.replaceAll("'", "''");
        const tempDatabaseName = 'auth-migration.db';
        const tempDatabaseUri = new File(DATABASE_DIRECTORY, tempDatabaseName).uri;
        const destinationUri = new File(DATABASE_DIRECTORY, DB_NAME).uri;
        const backupUri = `${destinationUri}.bak`;

        const moveFile = Effect.fnUntraced(function* (sourceUri: string, targetUri: string) {
            yield* Effect.promise(() => new File(sourceUri).move(new File(targetUri)));
        });

        const exportEncryptedCopy = Effect.fn('DatabaseRekeyService.exportEncryptedCopy')(function* (
            destinationPath: string,
            key: string | null,
            scrubStatements: readonly string[] = []
        ) {
            const { $client: client } = yield* Db;

            yield* client.unsafe('PRAGMA wal_checkpoint(FULL)').raw;
            yield* client.unsafe(`ATTACH DATABASE '${escapeSqlString(destinationPath)}' AS migrated KEY '${escapeSqlString(key ?? '')}'`)
                .raw;
            yield* client
                .unsafe('PRAGMA migrated.journal_mode = DELETE')
                .raw.pipe(
                    Effect.andThen(client.unsafe(`SELECT sqlcipher_export('migrated')`).raw),
                    Effect.andThen(Effect.forEach(scrubStatements, statement => client.unsafe(statement).raw, { discard: true })),
                    Effect.ensuring(Effect.ignore(client.unsafe('DETACH DATABASE migrated').raw))
                );
        });

        const generateKey = Effect.fn('DatabaseRekeyService.generateKey')(function* () {
            const { $client: client } = yield* Db;
            const [row] = yield* Schema.decodeUnknownEffect(RandomKeyRowsSchema)(
                yield* client.unsafe('SELECT lower(hex(randomblob(32))) AS key')
            );

            return row.key;
        });

        const updateMigratedDatabaseSettings = Effect.fn('DatabaseRekeyService.updateMigratedDatabaseSettings')(function* (
            databaseName: string,
            nextKey: string | null,
            nextSettings: Partial<SettingsCreateEntityInterface>
        ) {
            const client = yield* openSqliteClient(databaseName, nextKey).pipe(Effect.provideService(Reactivity.Reactivity, reactivity));
            const database = yield* makeEffectSqliteClientDatabase(client, { runQuery: identity });

            yield* settingsRepository.update(nextSettings).pipe(Effect.provideService(Db, withReplicas(database, [database])));
        }, Effect.scoped);

        const prepare = Effect.fn('DatabaseRekeyService.prepare')(function* (params: RekeyParamsInterface) {
            deleteDatabaseFiles(tempDatabaseUri);
            deleteDatabaseFiles(backupUri);
            yield* exportEncryptedCopy(`${DATABASE_LOCATION}/${tempDatabaseName}`, params.nextKey);

            if (params.nextSettings) {
                yield* updateMigratedDatabaseSettings(tempDatabaseName, params.nextKey, params.nextSettings);
            }
        });

        const commit = Effect.fn('DatabaseRekeyService.commit')(function* (onCommit: Effect.Effect<void>) {
            yield* databaseLifecycleService.close();
            deleteFileIfExists(`${destinationUri}-wal`);
            deleteFileIfExists(`${destinationUri}-shm`);
            if (new File(destinationUri).exists) {
                yield* moveFile(destinationUri, backupUri);
            }
            yield* moveFile(tempDatabaseUri, destinationUri);
            yield* onCommit;
            deleteDatabaseFiles(backupUri);
        });

        const restoreBackupDatabase = Effect.fn('DatabaseRekeyService.restoreBackupDatabase')(function* () {
            if (!new File(backupUri).exists) {
                return;
            }

            deleteDatabaseFiles(destinationUri);
            yield* moveFile(backupUri, destinationUri);
        });

        const exportFromDatabaseFile = Effect.fn('DatabaseRekeyService.exportFromDatabaseFile')(function* (
            sourceName: string,
            sourceKey: string,
            targetName: string,
            targetKey: string | null
        ) {
            const sourceClient = yield* openSqliteClient(sourceName, sourceKey).pipe(
                Effect.provideService(Reactivity.Reactivity, reactivity)
            );
            const sourceDatabase = yield* makeEffectSqliteClientDatabase(sourceClient, { runQuery: identity });

            yield* exportEncryptedCopy(`${DATABASE_LOCATION}/${targetName}`, targetKey).pipe(
                Effect.provideService(Db, withReplicas(sourceDatabase, [sourceDatabase]))
            );
        }, Effect.scoped);

        return {
            exportEncryptedCopy,
            generateKey,
            transcodeDatabaseFile: Effect.fn('DatabaseRekeyService.transcodeDatabaseFile')(function* (
                sourceName: string,
                sourceKey: string,
                targetName: string,
                targetKey: string | null,
                targetSettings: Partial<SettingsCreateEntityInterface>
            ) {
                deleteDatabaseFiles(new File(DATABASE_DIRECTORY, targetName).uri);
                yield* exportFromDatabaseFile(sourceName, sourceKey, targetName, targetKey);
                yield* updateMigratedDatabaseSettings(targetName, targetKey, targetSettings);
            }),
            rekey: Effect.fn('DatabaseRekeyService.rekey')(function* (params: RekeyParamsInterface, onCommit: Effect.Effect<void>) {
                yield* prepare(params).pipe(
                    Effect.andThen(commit(onCommit).pipe(Effect.onError(() => restoreBackupDatabase()))),
                    Effect.ensuring(
                        Effect.sync(() => {
                            deleteDatabaseFiles(tempDatabaseUri);
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
