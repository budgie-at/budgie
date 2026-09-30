import * as Effect from 'effect/Effect';

import { Workload } from '../../@generic/service/workload.service';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesSyncService } from '../../exchange-rate/service/exchange-rates-sync.service';

import { binanceSyncService } from './binance-sync.service';
import { monobankSyncService } from './monobank-sync.service';

class AppDataSyncService {
    private static readonly logAndContinue = Effect.catchCause(Effect.logError);

    readonly sync = Effect.fn('AppDataSyncService.sync')(function* () {
        const workload = yield* Workload;

        yield* AppDataSyncService.logAndContinue(accountBalanceIncrementalService.updateAllBalances(false));
        yield* AppDataSyncService.logAndContinue(exchangeRatesSyncService.sync());
        if (yield* workload.hasQueuedWork) {
            return false;
        }

        yield* AppDataSyncService.logAndContinue(monobankSyncService.sync());
        if (yield* workload.hasQueuedWork) {
            return false;
        }

        yield* AppDataSyncService.logAndContinue(binanceSyncService.sync());

        return true;
    });
}

export const appDataSyncService = new AppDataSyncService();
