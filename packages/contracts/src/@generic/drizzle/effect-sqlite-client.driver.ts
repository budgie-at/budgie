import { EffectCache } from 'drizzle-orm/cache/core/cache-effect';
import { EffectLogger } from 'drizzle-orm/effect-core';
import { SQLiteDialect } from 'drizzle-orm/sqlite-core';
import { SQLiteEffectDatabase, SQLiteEffectPreparedQuery, SQLiteEffectSession } from 'drizzle-orm/sqlite-core/effect';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { relations } from '../../relations';

import { EffectSqliteClientTransaction } from './effect-sqlite-client.transaction';

import type { DbMutationInterface } from '../interface/db-mutation.interface';
import type { DbQueryEffectHKTInterface } from '../interface/db-query-effect-hkt.interface';
import type { EffectSqliteClientOptionsInterface } from '../interface/effect-sqlite-client-options.interface';
import type { EffectSqliteClientSessionOptionsInterface } from '../interface/effect-sqlite-client-session-options.interface';
import type { DbConnectionType } from '../type/db.type';
import type { Query } from 'drizzle-orm';
import type { WithCacheConfig } from 'drizzle-orm/cache/core/types';
import type { PreparedQueryConfig, SQLiteExecuteMethod } from 'drizzle-orm/sqlite-core';
import type * as SqlClient from 'effect/sql/SqlClient';
import type { SqlError } from 'effect/sql/SqlError';

class EffectSqliteClientSession extends SQLiteEffectSession<unknown, DbQueryEffectHKTInterface, typeof relations> {
    constructor(
        private readonly client: SqlClient.SqlClient,
        dialect: SQLiteDialect,
        private readonly options: EffectSqliteClientSessionOptionsInterface
    ) {
        super(dialect);
    }

    // eslint-disable-next-line @typescript-eslint/max-params -- Existing public API intentionally keeps positional arguments
    prepareQuery<T extends PreparedQueryConfig = PreparedQueryConfig>(
        query: Query,
        mode: 'arrays' | 'objects' | 'raw',
        _prepare: boolean,
        executeMethod?: SQLiteExecuteMethod,
        mapper?: (rows: unknown[]) => unknown,
        queryMetadata?: { type: 'select' | 'update' | 'delete' | 'insert'; tables: string[] },
        cacheConfig?: WithCacheConfig
    ): SQLiteEffectPreparedQuery<T, DbQueryEffectHKTInterface> {
        const { client, options } = this;
        const mutation: DbMutationInterface | null =
            isDefined(queryMetadata) && queryMetadata.type !== 'select' && isNotEmptyArray(queryMetadata.tables)
                ? { type: queryMetadata.type, tables: queryMetadata.tables }
                : null;
        const execute = <A, E>(statement: Effect.Effect<A, E>) =>
            isDefined(mutation)
                ? options.runQuery(statement).pipe(Effect.tap(() => options.onMutate(mutation)))
                : options.runQuery(statement);
        const all = (params: unknown[]) =>
            execute(mode === 'arrays' ? client.unsafe(query.sql, params).values : client.unsafe(query.sql, params).withoutTransform);

        return new SQLiteEffectPreparedQuery<T, DbQueryEffectHKTInterface>(
            executeMethod,
            {
                all,
                get: params => Effect.map(all(params), rows => rows.at(0)),
                values: params => execute(client.unsafe(query.sql, params).values),
                run: params => execute(client.unsafe(query.sql, params).raw)
            },
            query,
            mapper,
            mode,
            options.logger,
            options.cache,
            queryMetadata,
            cacheConfig
        );
    }

    transaction<A, E, R>(transaction: (tx: EffectSqliteClientTransaction) => Effect.Effect<A, E, R>): Effect.Effect<A, E | SqlError, R> {
        return this.client.withTransaction(
            Effect.suspend(() => transaction(new EffectSqliteClientTransaction(this.dialect, this, relations)))
        );
    }
}

export const makeEffectSqliteClientDatabase = Effect.fnUntraced(function* (
    client: SqlClient.SqlClient,
    options: EffectSqliteClientOptionsInterface
) {
    const dialect = new SQLiteDialect();
    const onMutate = options.onMutate ?? (() => Effect.void);
    const session = new EffectSqliteClientSession(client, dialect, {
        ...options,
        onMutate,
        logger: yield* EffectLogger.make,
        cache: yield* EffectCache.make
    });

    return Object.assign(new SQLiteEffectDatabase(dialect, session, relations), {
        $client: client,
        $onMutate: onMutate
    }) satisfies DbConnectionType;
});
