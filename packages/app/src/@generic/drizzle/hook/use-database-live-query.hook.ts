import { useLiveQuery as useDrizzleLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useSyncExternalStore } from 'react';

import { databaseLiveQueryRevisionStore } from '../store/database-live-query-revision.store';

export const useDatabaseLiveQuery = <Query extends Parameters<typeof useDrizzleLiveQuery>[0]>(
    query: Query,
    dependencies: readonly unknown[] = []
) => {
    const revision = useSyncExternalStore(databaseLiveQueryRevisionStore.subscribe, databaseLiveQueryRevisionStore.getSnapshot);

    return useDrizzleLiveQuery(query, [...dependencies, revision]);
};
