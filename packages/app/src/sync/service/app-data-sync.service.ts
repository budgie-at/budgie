import { Log } from '@budgie/logger';

import { emptyFn, getErrorMessage } from '@rnw-community/shared';

import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesSyncService } from '../../exchange-rate/service/exchange-rates-sync.service';

import { binanceSyncService } from './binance-sync.service';
import { monobankSyncService } from './monobank-sync.service';
import { syncWorkloadService } from './sync-workload.service';

class AppDataSyncService {
    @Log('enter', result => `done isCompleted=${String(result)}`, error => `throw error=${getErrorMessage(error)}`)
    async sync(): Promise<boolean> {
        await accountBalanceIncrementalService.updateAllBalances(false).catch(emptyFn);

        await exchangeRatesSyncService.sync().catch(emptyFn);
        if (syncWorkloadService.hasQueuedUserWork()) {
            return false;
        }

        await monobankSyncService.sync().catch(emptyFn);
        if (syncWorkloadService.hasQueuedUserWork()) {
            return false;
        }

        await binanceSyncService.sync().catch(emptyFn);

        return true;
    }
}

export const appDataSyncService = new AppDataSyncService();
