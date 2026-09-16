import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { syncWorkloadService } from '@app/sync/service/sync-workload.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

export const resetSingletons = (): void => {
    Object.assign(binanceSyncService, { fiatSyncedAtMs: null, isRunning: false, runGeneration: 0, runRequested: false });
    resetMonobankSyncSingleton();
    Object.assign(syncWorkloadService, {
        backgroundQueue: [],
        drainGeneration: 0,
        isAcceptingWork: true,
        isRunning: false,
        queuedUserWorkListeners: new Set(),
        userQueue: []
    });
    Object.assign(transferConsolidationService, { isRunning: false });
};

export const resetMonobankSyncSingleton = (): void => {
    Object.assign(monobankSyncService, {
        isRunning: false,
        mccCategoryLookupMap: new Map(),
        runGeneration: 0,
        runRequested: false
    });
};
