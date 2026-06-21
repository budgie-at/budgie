import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

export const resetSingletons = (): void => {
    Object.assign(monobankSyncService, { isRunning: false, mccCategoryLookupMap: new Map() });
    Object.assign(syncWorkloadService, {
        activeWork: null,
        generation: 0,
        isAcceptingWork: true,
        priorityGeneration: 0,
        queue: Promise.resolve(),
        queuedCount: 0,
        queuedUserCount: 0,
        userQueue: Promise.resolve()
    });
    Object.assign(transferConsolidationService, { isRunning: false });
};
