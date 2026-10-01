import type { DbQueryEffectHKTInterface } from '../interface/db-query-effect-hkt.interface';
import type { EffectSqliteClientOptionsInterface } from '../interface/effect-sqlite-client-options.interface';
import type { DbRelationsType } from './db-relations.type';
import type { SQLiteEffectDatabase, SQLiteEffectWithReplicas } from 'drizzle-orm/sqlite-core/effect';
import type * as SqlClient from 'effect/sql/SqlClient';

export type DbConnectionType = SQLiteEffectDatabase<DbQueryEffectHKTInterface, unknown, DbRelationsType> & {
    readonly $client: SqlClient.SqlClient;
    readonly $onMutate: EffectSqliteClientOptionsInterface['onMutate'];
};

export type DB = SQLiteEffectWithReplicas<DbConnectionType>;
