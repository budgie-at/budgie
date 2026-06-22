import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { useDatabaseRefreshVersion } from './use-database-refresh-version.hook';

import type { AnySQLiteSelect } from 'drizzle-orm/sqlite-core';
import type { SQLiteRelationalQuery } from 'drizzle-orm/sqlite-core/query-builders/query';

export const useDatabaseLiveQuery = <Query extends Pick<AnySQLiteSelect, '_' | 'then'> | SQLiteRelationalQuery<'sync', unknown>>(
    query: Query,
    dependencies: unknown[] = []
) => useLiveQuery(query, [...dependencies, useDatabaseRefreshVersion()]);
