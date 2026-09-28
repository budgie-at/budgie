import { useSyncExternalStore } from 'react';

import { databaseRefreshService } from '../service/database-refresh.service';

export const useDatabaseRefreshVersion = (tableName: string | null): number =>
    useSyncExternalStore(databaseRefreshService.subscribe, () => databaseRefreshService.getSnapshot(tableName));
