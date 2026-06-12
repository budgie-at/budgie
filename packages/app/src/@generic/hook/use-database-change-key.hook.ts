import { useSyncExternalStore } from 'react';

import { databaseChangeService } from '../service/database-change.service';

const subscribe = (listener: () => void): (() => void) => databaseChangeService.subscribe(listener);
const getSnapshot = (): number => databaseChangeService.getSnapshot();

export const useDatabaseChangeKey = (): number => useSyncExternalStore(subscribe, getSnapshot);
