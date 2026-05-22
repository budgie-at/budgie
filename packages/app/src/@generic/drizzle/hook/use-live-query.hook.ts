import { emptyFn, getErrorMessage } from '@rnw-community/shared';
import { is } from 'drizzle-orm';
import { getTableConfig, getViewConfig, SQLiteTable, SQLiteView } from 'drizzle-orm/sqlite-core';
import { useEffect, useState } from 'react';

import { addDatabaseChangeListener } from '../db/db';

import type { LiveQueryInterface } from './interface/live-query.interface';
import type { LiveQueryResultInterface } from './interface/live-query-result.interface';

export const useLiveQuery = <TData>(
    query: LiveQueryInterface<TData>,
    dependencies: readonly unknown[] = []
): LiveQueryResultInterface<TData> => {
    const [data, setData] = useState<TData>();
    const [error, setError] = useState<Error>();
    const [updatedAt, setUpdatedAt] = useState<Date>();

    useEffect(() => {
        const queryConfig = Reflect.get(query, 'config');
        const entity = Reflect.get(query, 'table') ?? Reflect.get(queryConfig ?? {}, 'table');
        const handleData = (nextData: TData) => {
            setData(nextData);
            setUpdatedAt(new Date());
        };
        const handleError = (nextError: unknown) => setError(new Error(getErrorMessage(nextError)));

        query.then(handleData).catch(handleError);

        if (is(entity, SQLiteTable) || is(entity, SQLiteView)) {
            const config = is(entity, SQLiteTable) ? getTableConfig(entity) : getViewConfig(entity);
            const listener = addDatabaseChangeListener(tableName => {
                if (config.name === tableName) {
                    query.then(handleData).catch(handleError);
                }
            });

            return () => {
                listener.remove();
            };
        }

        return emptyFn;
    }, dependencies);

    return { data, error, updatedAt };
};
