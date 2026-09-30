import * as Effect from 'effect/Effect';

import { Workload } from '../../@generic/service/workload.service';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { accountBalanceIncrementalService } from '../../account/service/account-balance-incremental.service';
import { exchangeRatesSyncService } from '../../exchange-rate/service/exchange-rates-sync.service';

import { binanceSyncService } from './binance-sync.service';
import { monobankSyncService } from './monobank-sync.service';

class AppDataSyncService {
    readonly sync = Effect.fn('AppDataSyncService.sync')(function* () {
        const workload = yield* Workload;

        yield* logAndContinue(accountBalanceIncrementalService.updateAllBalances(false));
        yield* logAndContinue(exchangeRatesSyncService.sync());
        if (yield* workload.hasQueuedUserWork) {
            return false;
        }

        yield* logAndContinue(monobankSyncService.sync());
        if (yield* workload.hasQueuedUserWork) {
            return false;
        }

        yield* logAndContinue(binanceSyncService.sync());

        return true;
    });
}

export const appDataSyncService = new AppDataSyncService();
