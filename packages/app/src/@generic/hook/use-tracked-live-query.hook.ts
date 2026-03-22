import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { AnySQLiteSelect } from 'drizzle-orm/sqlite-core';
import { SQLiteRelationalQuery } from 'drizzle-orm/sqlite-core/query-builders/query';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { DependencyList, useEffect, useState } from 'react';

export const useTrackedLiveQuery = <
    TQuery extends Pick<AnySQLiteSelect, '_' | 'then'> | SQLiteRelationalQuery<'sync', unknown>
>(
    query: TQuery,
    dependencies: DependencyList,
    trackedTableNames: string[]
) => {
    const [version, setVersion] = useState(0);
    const trackedTableNamesKey = trackedTableNames.join(',');

    useEffect(() => {
        const subscription = addDatabaseChangeListener(({ tableName }) => {
            if (trackedTableNames.includes(tableName)) {
                setVersion(currentVersion => currentVersion + 1);
            }
        });

        return () => void subscription.remove();
    }, [trackedTableNames, trackedTableNamesKey]);

    return useLiveQuery(query, [...dependencies, version]);
};
