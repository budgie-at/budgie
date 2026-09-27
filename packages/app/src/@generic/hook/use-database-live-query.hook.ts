import { useDatabaseRefreshVersion } from './use-database-refresh-version.hook';
import { useDatabaseTableLiveQuery } from './use-database-table-live-query.hook';

import type { DatabaseLiveQueryType } from '../type/database-live-query.type';

export const useDatabaseLiveQuery = <Query extends DatabaseLiveQueryType>(query: Query, dependencies: unknown[] = []) =>
    useDatabaseTableLiveQuery(query, [...dependencies, useDatabaseRefreshVersion()]);
