import type { AnySQLiteSelect } from 'drizzle-orm/sqlite-core';
import type { SQLiteRelationalQuery } from 'drizzle-orm/sqlite-core/query-builders/query';

export type DatabaseLiveQueryType = Pick<AnySQLiteSelect, '_' | 'then'> | SQLiteRelationalQuery<'sync', unknown>;
