import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

export const resetSingletons = (): void => {
    Object.assign(monobankSyncService, { isRunning: false, mccCategoryIdMap: new Map() });
    Object.assign(transferConsolidationService, { isRunning: false });
};
