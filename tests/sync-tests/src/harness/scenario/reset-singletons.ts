import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

export const resetSingletons = (): void => {
    Object.assign(binanceSyncService, {
        failedSyncId: null,
        fiatSyncedAtMs: null,
        processedForwardSyncIds: new Set(),
        runSignedClient: null,
        runClientToken: null,
        runExchangeAccounts: null
    });
    Object.assign(monobankSyncService, {
        failedSyncId: null,
        mccCategoryLookupMap: new Map(),
        processedForwardSyncIds: new Set()
    });
};
