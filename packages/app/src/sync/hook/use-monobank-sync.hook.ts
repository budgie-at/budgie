/* eslint-disable lingui/no-unlocalized-strings */
import { monobankSyncService } from '../../account/service/monobank-sync.service';
import { useSyncContext } from '../context/sync.context';

export const useMonobankSync = () => {
    const { startSync, updateProgress, completeSync, failSync, isSyncing } = useSyncContext();

    const sync = async () => {
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
    };

    return { sync, isSyncing };
};
