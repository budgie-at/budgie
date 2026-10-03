import { makeEffectSqliteClientDatabase } from '@budgie/contracts';
import * as SqliteClient from '@effect/sql-sqlite-react-native/SqliteClient';
import { withReplicas } from 'drizzle-orm/sqlite-core/effect';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { identity } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Scope from 'effect/Scope';

import { getErrorMessage } from '@rnw-community/shared';

import { DB_NAME } from '../constant/db-name.constant';
import { DatabaseOpenError } from '../error/database-open.error';
import { openSqliteClient } from '../utils/open-sqlite-client.util';
import { readDatabaseKey } from '../utils/read-database-key.util';

import { DatabaseChangeService } from './database-change.service';

import type * as SqlClient from 'effect/sql/SqlClient';
import type { SqlError } from 'effect/sql/SqlError';

export class DatabaseConnectionService extends Context.Service<DatabaseConnectionService>()('@budgie/app/DatabaseConnectionService', {
    make: Effect.gen(function* () {
        const databaseChangeService = yield* DatabaseChangeService;
        const vectorTableNames = ['title_embedding_vec', 'merchant_embedding_vec', 'comment_embedding_vec'];
        const scope = yield* Scope.make();

        yield* Effect.addFinalizer(exit => Scope.close(scope, exit));

        const applyPragmas = (client: SqlClient.SqlClient, pragmas: ReadonlyArray<Effect.Effect<unknown, SqlError>>) =>
            Effect.all(
                [
                    ...pragmas,
                    client`PRAGMA busy_timeout = 5000`.raw,
                    client`PRAGMA cache_size = -20000`.raw,
                    client`PRAGMA mmap_size = 268435456`.raw,
                    client`PRAGMA temp_store = MEMORY`.raw
                ],
                { discard: true }
            ).pipe(Effect.mapError(cause => new DatabaseOpenError({ cause })));
        const openConnection = openSqliteClient(DB_NAME, yield* readDatabaseKey).pipe(Scope.provide(scope));
        const writer = yield* openConnection;

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

        const reader = yield* openConnection;

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
        Layer.provide(DatabaseChangeService.layer)
    );
}
