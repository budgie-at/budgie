import { SyncModeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import {
    binanceStub,
    buildBinance,
    buildBinanceToken,
    buildEarnDayKey,
    deferAtRequest,
    fetchBinanceEntriesByExternalId,
    fetchBinanceTransactions,
    fetchHistoryProgress,
    jumpPastDeadline,
    recentDayInMonthsAgo,
    restoreRealTimers,
    resyncBinance,
    RUN_DEADLINE_MS,
    setupBinanceFixture,
    skipRequestedSync,
    TestLayer
} from '../../harness';

import type { TimeWindow } from '../../harness';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const EARN_WINDOW_MS = 30 * DAY_MS;
const DEFER_AT_REQUEST = 4;
const MICRO_UNITS = 1_000_000;
const FIRST_KEY = 'test-api-key';
const SECOND_KEY = 'second-earn-key';
const FIRST_KEY_UID = 2001;
const SECOND_KEY_UID = 2002;

const earnReward = (rewards: string, time: number) => buildBinance.earnReward({ asset: 'USDT', rewards, time });

const expectEarnEntryMicroUnits = (dayStartMs: number, expectedMicroUnits: number) =>
    Effect.gen(function* () {
        const entries = yield* fetchBinanceEntriesByExternalId(`binance:earn:USDT:${buildEarnDayKey(dayStartMs)}`);

        expect(entries).toHaveLength(1);
        expect(entries[0].amount).toBe(expectedMicroUnits);
    });

describe('binance/earn-rewards', () => {
    it.effect('updates the open day total when a later reward arrives in a second sync', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const dayStartMs = Math.floor(Date.now() / DAY_MS) * DAY_MS - DAY_MS;
            const morningReward = earnReward('0.5', dayStartMs + 10 * MINUTE_MS);
            const { sync } = yield* setupBinanceFixture({ asset: 'USDT' });
            binanceStub.earnRewards([morningReward]);

            yield* binanceSyncService.sync();
            yield* expectEarnEntryMicroUnits(dayStartMs, MICRO_UNITS / 2);

            binanceStub.earnRewards([morningReward, earnReward('0.25', dayStartMs + 8 * HOUR_MS)]);
            yield* resyncBinance(sync.id);

            expect(yield* fetchBinanceTransactions).toHaveLength(1);
            yield* expectEarnEntryMicroUnits(dayStartMs, (MICRO_UNITS * 3) / 4);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('books the full day total when the sync window starts mid-day', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const dayStartMs = recentDayInMonthsAgo(1);
            yield* setupBinanceFixture({
                asset: 'USDT',
                mode: SyncModeEnum.FORWARD,
                forwardSyncedAt: new Date(dayStartMs + DAY_MS + 9 * HOUR_MS)
            });
            binanceStub.earnRewards([earnReward('0.5', dayStartMs + 10 * MINUTE_MS), earnReward('0.25', dayStartMs + 10 * HOUR_MS)]);

            yield* binanceSyncService.sync();

            expect(yield* fetchBinanceTransactions).toHaveLength(1);
            yield* expectEarnEntryMicroUnits(dayStartMs, (MICRO_UNITS * 3) / 4);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('books sub-micro rewards once their exact daily sum reaches a micro-unit', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const dayStartMs = recentDayInMonthsAgo(1);
            yield* setupBinanceFixture({ asset: 'USDT' });
            binanceStub.earnRewards(
                Array.from({ length: 4 }, (_value, index) => earnReward('0.00000087', dayStartMs + (index + 1) * HOUR_MS))
            );

            yield* binanceSyncService.sync();

            yield* expectEarnEntryMicroUnits(dayStartMs, 3);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('gives two keys earning the same asset on the same day their own earn rows', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const dayStartMs = recentDayInMonthsAgo(1);
            yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.BACKWARD });
            binanceStub.accountsByApiKey([
                { apiKey: FIRST_KEY, uid: FIRST_KEY_UID, spotBalances: [buildBinance.balance({ asset: 'USDT', free: '10' })] },
                { apiKey: SECOND_KEY, uid: SECOND_KEY_UID, spotBalances: [buildBinance.balance({ asset: 'USDT', free: '20' })] }
            ]);
            binanceStub.earnRewards([earnReward('0.5', dayStartMs + HOUR_MS)]);
            yield* skipRequestedSync(binanceSyncService.setupAccountSyncBatch(buildBinanceToken(SECOND_KEY), ['SPOT:USDT']));

            yield* binanceSyncService.sync();

            const transactions = yield* fetchBinanceTransactions;
            expect(transactions).toHaveLength(2);
            expect(new Set(transactions.map(transaction => transaction.toAccountId)).size).toBe(2);
            expect(new Set(transactions.map(transaction => transaction.externalId)).size).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps the full day total when a deferred backfill resumes in the middle of a UTC day', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const nowMs = Math.floor(Date.now() / DAY_MS) * DAY_MS - DAY_MS + 12 * HOUR_MS;
            vi.useFakeTimers({ now: nowMs, toFake: ['Date'] });
            const legacyFrontierMs = nowMs - DEFER_AT_REQUEST * (EARN_WINDOW_MS + 1);
            const rewards = [earnReward('1', legacyFrontierMs - 10 * MINUTE_MS), earnReward('1', legacyFrontierMs + 10 * MINUTE_MS)];

            const { sync, token } = yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
            binanceStub.earnRewards(rewards, [], { onServed: deferAtRequest(DEFER_AT_REQUEST) });
            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS);
            expect((yield* fetchHistoryProgress(token))['EARN'].tailAt).toBeGreaterThan(nowMs - 200 * DAY_MS);

            jumpPastDeadline();
            binanceStub.earnRewards(rewards, [], { onServed: emptyFn });
            yield* resyncBinance(sync.id);

            yield* expectEarnEntryMicroUnits(legacyFrontierMs, 2 * MICRO_UNITS);
        }).pipe(Effect.ensuring(restoreRealTimers), Effect.provide(TestLayer))
    );

    it.effect('splits the earn reward walk on UTC day boundaries', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const requestedWindows: TimeWindow[] = [];
            yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
            binanceStub.earnRewards([], requestedWindows);

            yield* binanceSyncService.sync();

            expect(requestedWindows.length).toBeGreaterThan(1);
            for (const window of requestedWindows) {
                expect(window.startMs % DAY_MS).toBe(0);
            }
            for (const window of requestedWindows.slice(1)) {
                expect((window.endMs + 1) % DAY_MS).toBe(0);
            }
        }).pipe(Effect.provide(TestLayer))
    );
});
