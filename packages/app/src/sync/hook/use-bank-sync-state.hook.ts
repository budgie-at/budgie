import { BankProviderEnum } from '@budgie/bank-sync';
import { useEffect, useState } from 'react';

import { SyncStatusEnum } from '../enum/sync-status.enum';
import { BankSyncStateInterface } from '../interface/bank-sync-state.interface';
import { emptySyncProgress } from '../interface/sync-progress.interface';
import { bankSyncStorageService } from '../service/bank-sync-storage.service';

const POLL_INTERVAL_MS = 1000;

const createEmptyState = (provider: BankProviderEnum): BankSyncStateInterface => ({
    provider,
    progress: emptySyncProgress,
    lastSyncAt: null,
    lastError: null
});

export const useBankSyncState = (provider: BankProviderEnum) => {
    const [state, setState] = useState<BankSyncStateInterface>(createEmptyState(provider));
    const [isEnabled, setIsEnabled] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadState = async () => {
            const [syncState, enabled] = await Promise.all([
                bankSyncStorageService.getState(provider),
                bankSyncStorageService.isEnabled(provider)
            ]);

            if (isMounted) {
                setState(syncState);
                setIsEnabled(enabled);
            }
        };

        void loadState();

        const interval = setInterval(() => {
            void loadState();
        }, POLL_INTERVAL_MS);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [provider]);

    const isSyncing = state.progress.status === SyncStatusEnum.SYNCING;

    return { state, isEnabled, isSyncing };
};
