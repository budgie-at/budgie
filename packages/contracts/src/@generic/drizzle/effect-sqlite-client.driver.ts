import { entityKind } from 'drizzle-orm';
import { EffectCache } from 'drizzle-orm/cache/core/cache-effect';
import { EffectLogger } from 'drizzle-orm/effect-core';
import { SQLiteDialect } from 'drizzle-orm/sqlite-core';
import {
    SQLiteEffectDatabase,
    SQLiteEffectPreparedQuery,
    SQLiteEffectSession,
    SQLiteEffectTransaction
} from 'drizzle-orm/sqlite-core/effect';
import * as Effect from 'effect/Effect';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { relations } from '../../relations';

import type { DbQueryEffectHKTInterface } from '../interface/db-query-effect-hkt.interface';
import type { EffectSqliteClientOptionsInterface } from '../interface/effect-sqlite-client-options.interface';
import type { DbConnectionType } from '../type/db.type';
import type { Query } from 'drizzle-orm';
import type { EffectCacheShape } from 'drizzle-orm/cache/core/cache-effect';
import type { WithCacheConfig } from 'drizzle-orm/cache/core/types';
import type { EffectLoggerShape } from 'drizzle-orm/effect-core';
import type { PreparedQueryConfig, SQLiteExecuteMethod } from 'drizzle-orm/sqlite-core';
import type * as SqlClient from 'effect/sql/SqlClient';
import type { SqlError } from 'effect/sql/SqlError';

type Relations = typeof relations;

class EffectSqliteClientSession extends SQLiteEffectSession<unknown, DbQueryEffectHKTInterface, Relations> {
    static override readonly [entityKind]: string = 'EffectSqliteClientSession';

    constructor(
        private readonly client: SqlClient.SqlClient,
        dialect: SQLiteDialect,
        private readonly logger: EffectLoggerShape,
        private readonly cache: EffectCacheShape,
        private readonly options: EffectSqliteClientOptionsInterface
    ) {
        super(dialect);
    }

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
        const mutatedTableNames = isDefined(queryMetadata) && queryMetadata.type !== 'select' ? queryMetadata.tables : [];
        const execute = <A, E>(statement: Effect.Effect<A, E>) =>
            isNotEmptyArray(mutatedTableNames)
                ? options.runQuery(statement).pipe(Effect.tap(() => options.onMutate(mutatedTableNames)))
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
            this.logger,
            this.cache,
            queryMetadata,
            cacheConfig
        );
    }

    transaction<A, E, R>(
        transaction: (tx: SQLiteEffectTransaction<DbQueryEffectHKTInterface, unknown, Relations>) => Effect.Effect<A, E, R>
    ): Effect.Effect<A, E | SqlError, R> {
        return this.client.withTransaction(
            Effect.suspend(() => transaction(new EffectSqliteClientTransaction(this.dialect, this, relations)))
        );
    }
}

class EffectSqliteClientTransaction extends SQLiteEffectTransaction<DbQueryEffectHKTInterface, unknown, Relations> {
    static override readonly [entityKind]: string = 'EffectSqliteClientTransaction';
}

export const makeEffectSqliteClientDatabase = Effect.fnUntraced(function* (
    client: SqlClient.SqlClient,
    options: EffectSqliteClientOptionsInterface
) {
    const dialect = new SQLiteDialect();
    const session = new EffectSqliteClientSession(client, dialect, yield* EffectLogger.make, yield* EffectCache.make, options);

    return Object.assign(new SQLiteEffectDatabase(dialect, session, relations), { $client: client }) satisfies DbConnectionType;
});
