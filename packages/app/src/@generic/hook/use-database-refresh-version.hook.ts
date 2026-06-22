import { useSyncExternalStore } from 'react';

import { databaseRefreshService } from '../service/database-refresh.service';

export const useDatabaseRefreshVersion = (): number =>
    useSyncExternalStore(databaseRefreshService.subscribe, databaseRefreshService.getSnapshot);
