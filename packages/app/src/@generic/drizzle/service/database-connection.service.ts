import { makeEffectSqliteClientDatabase } from '@budgie/contracts';
import * as SqliteClient from '@effect/sql-sqlite-react-native/SqliteClient';
import { withReplicas } from 'drizzle-orm/sqlite-core/effect';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { identity } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Scope from 'effect/Scope';
import { File } from 'expo-file-system';

import { getErrorMessage, isDefined } from '@rnw-community/shared';

import { recoverInterruptedRestore } from '../../../cloud-backup/utils/recover-interrupted-restore.util';
import { deleteIfExists } from '../../utils/delete-if-exists.util';
import { DATABASE_DIRECTORY } from '../constant/database-directory.constant';
import { DB_NAME } from '../constant/db-name.constant';
import { REPLACED_DATABASE_PREFIX } from '../constant/replaced-database-prefix.constant';
import { DatabaseOpenError } from '../error/database-open.error';
import { openSqliteClient } from '../utils/open-sqlite-client.util';
import { readDatabaseKey } from '../utils/read-database-key.util';

import { DatabaseChangeService } from './database-change.service';
import { DatabaseSwapService } from './database-swap.service';

import type * as SqlClient from 'effect/sql/SqlClient';
import type { SqlError } from 'effect/sql/SqlError';

export class DatabaseConnectionService extends Context.Service<DatabaseConnectionService>()('@budgie/app/DatabaseConnectionService', {
    make: Effect.gen(function* () {
        const databaseChangeService = yield* DatabaseChangeService;
        const databaseSwapService = yield* DatabaseSwapService;
        const vectorTableNames = ['title_embedding_vec', 'merchant_embedding_vec', 'comment_embedding_vec'];
        const scope = yield* Scope.make();

        yield* Effect.addFinalizer(exit => Scope.close(scope, exit));

        const applyPragmas = (client: SqlClient.SqlClient, pragmas: ReadonlyArray<Effect.Effect<unknown, SqlError>>) =>
            Effect.all(
                [
                    ...pragmas,
                    client`PRAGMA cache_size = -20000`.raw,
                    client`PRAGMA mmap_size = 268435456`.raw,
                    client`PRAGMA temp_store = MEMORY`.raw
                ],
                { discard: true }
            ).pipe(Effect.mapError(cause => DatabaseOpenError.make({ cause })));

        const restoreAsLiveDatabase = (source: File, suffix: string) =>
            Effect.tryPromise({
                try: () => source.move(new File(DATABASE_DIRECTORY, `${DB_NAME}${suffix}`), { overwrite: true }),
                catch: cause => DatabaseOpenError.make({ cause })
            });

        const recoverMissingDatabase = (swapBackupName: string | null) =>
            Effect.gen(function* () {
                if (new File(DATABASE_DIRECTORY, DB_NAME).exists || !DATABASE_DIRECTORY.exists) {
                    return;
                }

                const newestMovedAside = DATABASE_DIRECTORY.list()
                    .map(entry => entry.name)
                    .filter(name => name.startsWith(REPLACED_DATABASE_PREFIX))
                    .map(name => name.slice(REPLACED_DATABASE_PREFIX.length))
                    .filter(movedAt => /^\d+$/u.test(movedAt))
                    .map(Number)
                    .sort((left, right) => right - left)
                    .map(movedAt => `${REPLACED_DATABASE_PREFIX}${movedAt}`)
                    .at(0);
                const backupName = [swapBackupName, `${DB_NAME}.bak`, newestMovedAside]
                    .filter(isDefined)
                    .find(name => new File(DATABASE_DIRECTORY, name).exists);

                if (!isDefined(backupName)) {
                    return;
                }

                yield* Effect.forEach(
                    ['-wal', '-shm', ''],
                    suffix => {
                        const backup = new File(DATABASE_DIRECTORY, `${backupName}${suffix}`);

                        return backup.exists ? restoreAsLiveDatabase(backup, suffix) : Effect.void;
                    },
                    { discard: true }
                );
            }).pipe(Effect.catchDefect(cause => Effect.fail(DatabaseOpenError.make({ cause }))));

        const openConnections = (databaseKey: string | null, connectionScope: Scope.Scope) => {
            const openConnection = openSqliteClient(DB_NAME, databaseKey).pipe(Scope.provide(connectionScope));

            return Effect.all([openConnection, openConnection], { concurrency: 'unbounded' });
        };

        const isLiveBeforeRecovery = new File(DATABASE_DIRECTORY, DB_NAME).exists;
        const pendingSwap = yield* databaseSwapService.read;

        yield* recoverInterruptedRestore.pipe(Effect.catchDefect(defect => Effect.logError(defect)));
        yield* recoverMissingDatabase(pendingSwap?.backupName ?? null);

        const finishedSwap =
            isLiveBeforeRecovery && isDefined(pendingSwap) && new File(DATABASE_DIRECTORY, pendingSwap.backupName).exists
                ? pendingSwap
                : null;
        const openWithStoredKey = Effect.flatMap(readDatabaseKey, databaseKey => openConnections(databaseKey, scope));
        const [writer, reader] = yield* isDefined(finishedSwap)
            ? Effect.flatMap(Scope.fork(scope), swapScope =>
                  openConnections(finishedSwap.key, swapScope).pipe(Effect.onError(() => Scope.close(swapScope, Exit.void)))
              ).pipe(
                  Effect.tap(() => databaseSwapService.commit(finishedSwap)),
                  Effect.tap(() =>
                      Effect.sync(() => {
                          ['', '-wal', '-shm'].forEach(suffix => {
                              deleteIfExists(new File(DATABASE_DIRECTORY, `${finishedSwap.backupName}${suffix}`));
                          });
                      })
                  ),
                  Effect.catchTags({ DatabaseOpenError: () => openWithStoredKey })
              )
            : openWithStoredKey;

        if (isDefined(pendingSwap)) {
            yield* databaseSwapService.end.pipe(Effect.catchDefect(defect => Effect.logError(defect)));
        }

        yield* applyPragmas(writer, [
            writer`PRAGMA journal_mode = WAL`.raw,
            writer`PRAGMA foreign_keys = ON`.raw,
            writer`PRAGMA synchronous = NORMAL`.raw
        ]);
        yield* Effect.forEach(
            vectorTableNames,
            tableName => writer`CREATE VIRTUAL TABLE IF NOT EXISTS ${writer(tableName)} USING vec0(embedding float[768])`.raw,
            { discard: true }
        ).pipe(Effect.catch(vecError => Effect.logError('sqlite:vec-init-error', { errorMessage: getErrorMessage(vecError) })));

        yield* applyPragmas(reader, [reader`PRAGMA query_only = 1`.raw]);

        const primary = yield* makeEffectSqliteClientDatabase(writer, { onMutate: databaseChangeService.record, runQuery: identity });
        const replica = yield* makeEffectSqliteClientDatabase(reader, { runQuery: SqliteClient.withAsyncQuery });

        return {
            db: withReplicas(primary, [replica]),
            close: Scope.close(scope, Exit.void)
        };
    })
}) {
    static readonly layer = Layer.effect(DatabaseConnectionService, DatabaseConnectionService.make).pipe(
        Layer.orDie,
        Layer.provide([DatabaseChangeService.layer, DatabaseSwapService.layer])
    );
}
