/* eslint-disable lingui/no-unlocalized-strings */
import { useCallback } from 'react';

import { useSyncContext } from '../../@generic/sync/provider/sync.provider';
import { monobankSyncService } from '../service/monobank-sync.service';

export const useMonobankSync = () => {
    const { startSync, updateProgress, completeSync, failSync, isSyncing } = useSyncContext();

    const sync = useCallback(async () => {
        if (isSyncing) {
            return;
        }

        startSync();

        try {
            await monobankSyncService.sync(progressData => {
                updateProgress(progressData);
            });

            completeSync();
        } catch (error) {
            failSync(error instanceof Error ? error.message : 'Sync failed');
        }
    }, [isSyncing, startSync, updateProgress, completeSync, failSync]);

    return { sync, isSyncing };
};
