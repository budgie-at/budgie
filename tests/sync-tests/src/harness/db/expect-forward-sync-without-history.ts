import { SyncModeEnum } from '@budgie/contracts';
import { expect } from 'vitest';

import { fetchPersistedMonobankTransactions } from './fetch-persisted-monobank-transactions';
import { fetchSyncById } from './fetch-sync-by-id';

export const expectForwardSyncWithoutHistory = (syncId: number): void => {
    expect(fetchPersistedMonobankTransactions()).toHaveLength(0);
    expect(fetchSyncById(syncId).mode).toBe(SyncModeEnum.FORWARD);
};
