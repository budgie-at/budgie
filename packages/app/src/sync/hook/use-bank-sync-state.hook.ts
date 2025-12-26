import { BankProviderEnum } from '@budgie/bank-sync';
import { useEffect, useState } from 'react';

import { SyncStatusEnum } from '../enum/sync-status.enum';
import { BankSyncStateInterface } from '../interface/bank-sync-state.interface';
import { emptySyncProgress } from '../interface/sync-progress.interface';
import { bankSyncStorageService } from '../service/bank-sync-storage.service';

const POLL_INTERVAL_MS = 1000;

const createEmptyState = (provider: BankProviderEnum): BankSyncStateInterface => ({
    provider,
    enabled: false,
    token: null,
    progress: emptySyncProgress,
    lastSyncAt: null,
    lastError: null
});

export const useBankSyncState = (provider: BankProviderEnum) => {
    const [state, setState] = useState<BankSyncStateInterface>(createEmptyState(provider));

    useEffect(() => {
        const loadState = () => {
            setState(bankSyncStorageService.getState(provider));
        };

        loadState();

        const interval = setInterval(loadState, POLL_INTERVAL_MS);

        return () => {
            clearInterval(interval);
        };
    }, [provider]);

    const isSyncing = state.progress.status === SyncStatusEnum.SYNCING;
    const isEnabled = state.enabled;

    return { state, isEnabled, isSyncing };
};
