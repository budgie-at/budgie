import { PRECISION, SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import {
    binanceStub,
    buildBinance,
    fetchCachedBalanceAmount,
    fetchSyncById,
    seedCryptoInstrument,
    setupAdaUsdtFixture,
    setupBinanceFixture,
    TestLayer
} from '../../harness';

import type { TimeWindow } from '../../harness';

const STALE_SYNC_AGE_MS = 5 * 60 * 1000;
const RUN_DEADLINE_MS = 2 * 1000;
const DEADLINE_JUMP_MS = 4 * 1000;
const BETWEEN_FETCHES_JUMP_MS = 1000;

const advanceClock = (durationMs: number): void => {
    vi.setSystemTime(Date.now() + durationMs);
};

const jumpPastDeadline = (): void => {
    advanceClock(DEADLINE_JUMP_MS);
};

const advanceClockBetweenFetches = (): void => {
    advanceClock(BETWEEN_FETCHES_JUMP_MS);
};

const restoreRealTimers = Effect.sync(() => vi.useRealTimers());

describe('binance/deadline-handling', () => {
    it.effect('defers instead of disabling the sync when the deadline passes while anchoring balances', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const { sync, account } = yield* setupBinanceFixture({
                asset: 'BTC',
                mode: SyncModeEnum.FORWARD,
                forwardSyncedAt: new Date(Date.now() - STALE_SYNC_AGE_MS)
            });
            binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' })], jumpPastDeadline);

            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS).pipe(Effect.ensuring(restoreRealTimers));

            const storedSync = yield* fetchSyncById(sync.id);
            expect(storedSync.enabled).toBe(true);
            expect(storedSync.status).not.toBe(SyncStatusEnum.FAILED);

            binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' })]);
            yield* binanceSyncService.sync();

            expect(yield* fetchCachedBalanceAmount(account.id)).toBe(PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('previews accounts right after a deadline-bound run finished', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const { token } = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' })]);

            const preview = yield* Effect.gen(function* () {
                yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS);
                jumpPastDeadline();

                return yield* binanceSyncService.fetchAccountsPreview(token);
            }).pipe(Effect.ensuring(restoreRealTimers));

            expect(preview).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('fetches each history source once per run', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const depositWindows: TimeWindow[] = [];
            const c2cWindows: TimeWindow[] = [];

            yield* seedCryptoInstrument('ADA');
            yield* setupAdaUsdtFixture(SyncModeEnum.FORWARD, new Date(Date.now() - STALE_SYNC_AGE_MS));
            binanceStub.deposits([], depositWindows, advanceClockBetweenFetches);
            binanceStub.c2cOrders([], [], c2cWindows);

            yield* binanceSyncService.sync().pipe(Effect.ensuring(restoreRealTimers));

            expect(depositWindows).toHaveLength(1);
            expect(c2cWindows).toHaveLength(2);
        }).pipe(Effect.provide(TestLayer))
    );
});
