import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    buildEarnDayKey,
    fetchSortedBinanceExternalIds,
    recentDayInMonthsAgo,
    resyncBinance,
    seedCryptoInstrument,
    setupFiatScenario,
    TestLayer
} from '../../harness';

describe('binance/parallel-sources', () => {
    it.effect('commits every concurrently fetched source exactly once', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const dayStartMs = recentDayInMonthsAgo(1);

            const { sync } = yield* setupFiatScenario();
            yield* seedCryptoInstrument('BETH');
            binanceStub.fiatOrders([buildBinance.fiatOrder({ orderNo: 'fiat-parallel', fiatCurrency: 'EUR', amount: '100' })], []);
            binanceStub.ethStakingRewards([buildBinance.stakingReward({ asset: 'BETH', amount: '0.5', time: dayStartMs })]);
            binanceStub.lockedEarnRewards([buildBinance.lockedEarnReward({ asset: 'EUR', amount: '0.25', time: dayStartMs })]);

            yield* binanceSyncService.sync();
            const firstIds = yield* fetchSortedBinanceExternalIds();
            yield* resyncBinance(sync.id);

            expect(firstIds).toEqual(
                expect.arrayContaining([
                    'fiat-parallel',
                    `binance:eth-staking:BETH:${buildEarnDayKey(dayStartMs)}`,
                    `binance:earn-locked:EUR:${buildEarnDayKey(dayStartMs)}`
                ])
            );
            expect(yield* fetchSortedBinanceExternalIds()).toEqual(firstIds);
        }).pipe(Effect.provide(TestLayer))
    );
});
