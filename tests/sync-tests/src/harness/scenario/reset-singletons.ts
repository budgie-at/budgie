import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

export const resetSingletons = (): void => {
    Object.assign(binanceSyncService, { fiatSyncedAtMs: null, isRunning: false });
    Object.assign(monobankSyncService, { isRunning: false, mccCategoryLookupMap: new Map() });
    Object.assign(syncWorkloadService, {
        backgroundQueue: [],
        isAcceptingWork: true,
        isRunning: false,
        queuedUserWorkListeners: new Set(),
        userQueue: []
    });
    Object.assign(transferConsolidationService, { isRunning: false });
};
