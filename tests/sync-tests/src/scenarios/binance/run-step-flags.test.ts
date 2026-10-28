import { PRECISION, SyncModeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    fetchCachedBalanceAmount,
    fetchSortedBinanceExternalIds,
    fetchSyncById,
    setupBinanceFixture,
    setupStaleForwardFixture,
    STALE_SYNC_AGE_MS,
    TestLayer
} from '../../harness';

const FAILURES_EXHAUSTING_CLIENT_RETRIES = 4;
const RETRY_BACKOFF_TIMEOUT_MS = 30000;

describe('binance/run-step-flags', () => {
    it.effect(
        'refetches transfers after a transient fetch failure instead of completing the run without them',
        () =>
            Effect.gen(function* () {
                const binanceSyncService = yield* BinanceSyncService;
                const { sync } = yield* setupStaleForwardFixture();

                binanceStub.myTrades(
                    { ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id: 10, qty: '10', quoteQty: '5', commission: '0', isBuyer: true })] },
                    new Set<string>(),
                    [],
                    { failTimes: FAILURES_EXHAUSTING_CLIENT_RETRIES }
                );

                yield* binanceSyncService.sync();

                expect(yield* fetchSortedBinanceExternalIds()).toEqual(['binance:trade:ADAUSDT:10']);
                expect((yield* fetchSyncById(sync.id)).forwardSyncedAt?.getTime()).toBeGreaterThan(Date.now() - STALE_SYNC_AGE_MS);
            }).pipe(Effect.provide(TestLayer)),
        RETRY_BACKOFF_TIMEOUT_MS
    );

    it.effect(
        'retries balance anchoring within the same run after a transient failure',
        () =>
            Effect.gen(function* () {
                const binanceSyncService = yield* BinanceSyncService;

                const { account } = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
                binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' })], { failTimes: FAILURES_EXHAUSTING_CLIENT_RETRIES });

                yield* binanceSyncService.sync();

                expect(yield* fetchCachedBalanceAmount(account.id)).toBe(PRECISION);
            }).pipe(Effect.provide(TestLayer)),
        RETRY_BACKOFF_TIMEOUT_MS
    );
});
