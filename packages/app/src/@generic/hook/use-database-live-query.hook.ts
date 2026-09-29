import { is } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { getTableConfig, getViewConfig, SQLiteTable, SQLiteView } from 'drizzle-orm/sqlite-core';
import { SQLiteRelationalQuery } from 'drizzle-orm/sqlite-core/query-builders/query';

import { useDatabaseRefreshVersion } from './use-database-refresh-version.hook';

import type { DatabaseLiveQueryType } from '../type/database-live-query.type';

const getLiveQueryEntity = (query: DatabaseLiveQueryType): unknown => {
    if (is(query, SQLiteRelationalQuery)) {
        return 'table' in query ? query.table : null;
    }

    return query._.config.table;
};

const getLiveQueryTableName = (query: DatabaseLiveQueryType): string | null => {
    const entity = getLiveQueryEntity(query);

    if (is(entity, SQLiteTable)) {
        return getTableConfig(entity).name;
    }

    if (is(entity, SQLiteView)) {
        return getViewConfig(entity).name;
    }

    return null;
};

const withoutRowChangeListener = <Query extends DatabaseLiveQueryType>(query: Query): Query =>
    new Proxy(query, {
        get: (target, property) => {
            if (property === 'then') {
                return target.then.bind(target);
            }

            if (property === 'config' || property === 'table') {
                return {};
            }

            return Reflect.get(target, property);
        }
    });

export const useDatabaseLiveQuery = <Query extends DatabaseLiveQueryType>(query: Query, dependencies: unknown[] = []) =>
    useLiveQuery(withoutRowChangeListener(query), [...dependencies, useDatabaseRefreshVersion(getLiveQueryTableName(query))]);
