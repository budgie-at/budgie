import { AccountBalanceIncrementalService } from '@budgie/ledger';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { Workload } from '../../@generic/service/workload.service';
import { logAndContinue } from '../../@generic/utils/log-and-continue.util';
import { ExchangeRateBackgroundService } from '../../exchange-rate/service/exchange-rate-background.service';

import { BinanceSyncService } from './binance-sync.service';
import { MonobankSyncService } from './monobank-sync.service';

export class AppDataSyncService extends Context.Service<AppDataSyncService>()('@budgie/app/AppDataSyncService', {
    make: Effect.gen(function* () {
        const workload = yield* Workload;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const exchangeRateBackgroundService = yield* ExchangeRateBackgroundService;
        const monobankSyncService = yield* MonobankSyncService;
        const binanceSyncService = yield* BinanceSyncService;

        return {
            sync: Effect.fn('AppDataSyncService.sync')(function* () {
                yield* logAndContinue(accountBalanceIncrementalService.updateAllBalances(false));
                yield* logAndContinue(exchangeRateBackgroundService.sync());
                if (yield* workload.hasQueuedUserWork) {
                    return false;
                }

                yield* logAndContinue(monobankSyncService.sync());
                if (yield* workload.hasQueuedUserWork) {
                    return false;
                }

                yield* logAndContinue(binanceSyncService.sync());

                return true;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(AppDataSyncService, AppDataSyncService.make).pipe(
        Layer.provide([
            Workload.layer,
            AccountBalanceIncrementalService.layer,
            ExchangeRateBackgroundService.layer,
            MonobankSyncService.layer,
            BinanceSyncService.layer
        ])
    );
}
