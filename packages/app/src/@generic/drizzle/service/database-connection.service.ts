/* oxlint-disable lingui/no-unlocalized-strings */
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

export class DatabaseConnectionService extends Context.Service<DatabaseConnectionService>()('@budgie/app/DatabaseConnectionService', {
    make: Effect.gen(function* () {
        const databaseChangeService = yield* DatabaseChangeService;
        const connectionPragmas = [
            'PRAGMA busy_timeout = 5000',
            'PRAGMA cache_size = -20000',
            'PRAGMA mmap_size = 268435456',
            'PRAGMA temp_store = MEMORY'
        ];
        const writerPragmas = [
            'PRAGMA journal_mode = WAL',
            'PRAGMA foreign_keys = ON',
            'PRAGMA synchronous = NORMAL',
            ...connectionPragmas
        ];
        const readerPragmas = ['PRAGMA query_only = 1', ...connectionPragmas];
        const vectorTableNames = ['title_embedding_vec', 'merchant_embedding_vec', 'comment_embedding_vec'];
        const scope = yield* Scope.make();

        yield* Effect.addFinalizer(exit => Scope.close(scope, exit));

        const runStatements = (client: SqlClient.SqlClient, statements: readonly string[]) =>
            Effect.forEach(statements, statement => client.unsafe(statement).raw, { discard: true });

        const openConnection = Effect.fnUntraced(function* (encryptionKey: string | null, pragmas: readonly string[]) {
            const client = yield* openSqliteClient(DB_NAME, encryptionKey).pipe(Scope.provide(scope));

            yield* runStatements(client, pragmas).pipe(Effect.mapError(cause => new DatabaseOpenError({ cause })));

            return client;
        });

        const encryptionKey = yield* readDatabaseKey;
        const writer = yield* openConnection(encryptionKey, writerPragmas);

        yield* runStatements(
            writer,
            vectorTableNames.map(tableName => `CREATE VIRTUAL TABLE IF NOT EXISTS ${tableName} USING vec0(embedding float[768])`)
        ).pipe(Effect.catch(vecError => Effect.logError('sqlite:vec-init-error', { errorMessage: getErrorMessage(vecError) })));

        const reader = yield* openConnection(encryptionKey, readerPragmas);
        const primary = yield* makeEffectSqliteClientDatabase(writer, { onMutate: databaseChangeService.record, runQuery: identity });
        const replica = yield* makeEffectSqliteClientDatabase(reader, {
            onMutate: () => Effect.void,
            runQuery: SqliteClient.withAsyncQuery
        });

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
