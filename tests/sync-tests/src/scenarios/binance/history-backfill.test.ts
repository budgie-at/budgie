import { SyncModeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { emptyFn, isDefined } from '@rnw-community/shared';

import {
    advanceClock,
    binanceStub,
    buildBinance,
    deferAtRequest,
    fetchBinanceTransactions,
    fetchHistoryProgress,
    jumpPastDeadline,
    restoreRealTimers,
    resyncBinance,
    RUN_DEADLINE_MS,
    seedCryptoInstrument,
    setupBinanceFixture,
    STALE_SYNC_AGE_MS,
    TestLayer
} from '../../harness';

import type { TimeWindow } from '../../harness';

const DAY_MS = 86_400_000;
const OLD_AGE_MS = 1500 * DAY_MS;
const RECENT_AGE_MS = 5 * DAY_MS;
const LONG_PAUSE_MS = 45 * DAY_MS;
const DEFER_AT_REQUEST = 4;
const FAILING_AT_REQUEST = 4;
const FAILURES_EXHAUSTING_CLIENT_RETRIES = 4;
const RETRY_BACKOFF_TIMEOUT_MS = 30000;

interface BackfillSource {
    readonly name: string;
    readonly key: string;
    readonly needsBtcAccount: boolean;
    readonly stub: (timesMs: readonly number[], windows: TimeWindow[], onServed: () => void) => void;
}

const SOURCES: readonly BackfillSource[] = [
    {
        name: 'convert',
        key: 'CONVERT',
        needsBtcAccount: true,
        stub: (timesMs, windows, onServed) => {
            binanceStub.convertTradeFlow(
                timesMs.map((createTime, index) =>
                    buildBinance.convertFlow({
                        orderId: 9000 + index,
                        fromAsset: 'USDT',
                        fromAmount: '100',
                        toAsset: 'BTC',
                        toAmount: '0.001',
                        createTime
                    })
                ),
                windows,
                false,
                [],
                { onServed }
            );
        }
    },
    {
        name: 'earn',
        key: 'EARN',
        needsBtcAccount: false,
        stub: (timesMs, windows, onServed) => {
            binanceStub.earnRewards(
                timesMs.map(time => buildBinance.earnReward({ asset: 'USDT', rewards: '1', time })),
                windows,
                { onServed }
            );
        }
    },
    {
        name: 'capital',
        key: 'CAPITAL',
        needsBtcAccount: false,
        stub: (timesMs, windows, onServed) => {
            binanceStub.withdrawals(
                timesMs.map((time, index) =>
                    buildBinance.withdrawal({ id: `wd-${index}`, coin: 'USDT', amount: '1', applyTime: new Date(time).toISOString() })
                ),
                windows,
                { onServed }
            );
        }
    }
];

const FORWARD_SYNCED_SOURCES: readonly BackfillSource[] = [
    ...SOURCES,
    {
        name: 'p2p',
        key: 'C2C',
        needsBtcAccount: false,
        stub: (timesMs, windows) => {
            binanceStub.c2cOrders(
                timesMs.map((createTime, index) =>
                    buildBinance.c2cOrder({ orderNumber: `c2c-${index}`, tradeType: 'BUY', asset: 'USDT', amount: '1', createTime })
                ),
                [],
                windows
            );
        }
    }
];

const setupBackfillFixture = (needsBtcAccount: boolean, forwardSyncedAt?: Date) =>
    Effect.gen(function* () {
        if (needsBtcAccount) {
            yield* seedCryptoInstrument('BTC');
        }
        const fixture = yield* setupBinanceFixture({
            asset: 'USDT',
            mode: SyncModeEnum.FORWARD,
            ...(isDefined(forwardSyncedAt) && { forwardSyncedAt })
        });
        if (needsBtcAccount) {
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'USDT', free: '100' }),
                buildBinance.balance({ asset: 'BTC', free: '1' })
            ]);
        }

        return fixture;
    });

const seedBackfill = (source: BackfillSource, forwardSyncedAt?: Date) =>
    Effect.gen(function* () {
        const nowMs = Date.now();
        const timesMs = [nowMs - OLD_AGE_MS, nowMs - RECENT_AGE_MS];
        const fixture = yield* setupBackfillFixture(source.needsBtcAccount, forwardSyncedAt);

        return { ...fixture, nowMs, timesMs };
    });

const resyncAndCollectWindows = (source: BackfillSource, timesMs: readonly number[], syncId: number) =>
    Effect.gen(function* () {
        const windows: TimeWindow[] = [];
        source.stub(timesMs, windows, emptyFn);
        yield* resyncBinance(syncId);

        expect(windows.length).toBeGreaterThan(0);

        return windows.filter(window => window.startMs < Date.now() - 3 * DAY_MS);
    });

const countTransactions = () => Effect.map(fetchBinanceTransactions, transactions => transactions.length);

describe('binance/history-backfill', () => {
    it.effect.each(SOURCES)('completes a $name backfill split across several deferred runs', source =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const nowMs = Date.now();
            const timesMs = [nowMs - OLD_AGE_MS, nowMs - RECENT_AGE_MS];

            const { sync, token } = yield* setupBackfillFixture(source.needsBtcAccount);
            source.stub(timesMs, [], deferAtRequest(DEFER_AT_REQUEST));
            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS).pipe(Effect.ensuring(restoreRealTimers));

            const firstTailAt = (yield* fetchHistoryProgress(token))[source.key].tailAt;
            expect(yield* countTransactions()).toBe(1);
            expect(firstTailAt).toBeLessThan(Date.now() - 60 * DAY_MS);

            jumpPastDeadline();
            source.stub(timesMs, [], deferAtRequest(DEFER_AT_REQUEST));
            yield* resyncBinance(sync.id, true).pipe(Effect.ensuring(restoreRealTimers));

            const secondTailAt = (yield* fetchHistoryProgress(token))[source.key].tailAt;
            expect(yield* countTransactions()).toBe(1);
            expect(secondTailAt).toBeLessThan(firstTailAt - 30 * DAY_MS);

            const finalWindows: TimeWindow[] = [];
            jumpPastDeadline();
            source.stub(timesMs, finalWindows, emptyFn);
            yield* resyncBinance(sync.id).pipe(Effect.ensuring(restoreRealTimers));

            expect(yield* countTransactions()).toBe(2);
            expect((yield* fetchHistoryProgress(token))[source.key].tailAt).toBeLessThan(Date.now() - 1800 * DAY_MS);
            expect(finalWindows.filter(window => window.endMs < Date.now() - 2 * DAY_MS && window.endMs > secondTailAt + 1000)).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each(SOURCES)('does not walk a finished $name backfill again', source =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const { sync, timesMs } = yield* seedBackfill(source);
            source.stub(timesMs, [], emptyFn);
            yield* binanceSyncService.sync();

            expect(yield* resyncAndCollectWindows(source, timesMs, sync.id)).toEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('refetches the head from the last sync point after a long pause between deferred runs', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const [convertSource] = SOURCES;
            const nowMs = Date.now();
            const timesMs = [nowMs - OLD_AGE_MS, nowMs - RECENT_AGE_MS];

            const { sync } = yield* setupBackfillFixture(convertSource.needsBtcAccount);
            convertSource.stub(timesMs, [], deferAtRequest(DEFER_AT_REQUEST));
            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS).pipe(Effect.ensuring(restoreRealTimers));
            expect(yield* countTransactions()).toBe(1);

            advanceClock(LONG_PAUSE_MS)();
            convertSource.stub([...timesMs, nowMs + 10 * DAY_MS], [], emptyFn);
            yield* resyncBinance(sync.id).pipe(Effect.ensuring(restoreRealTimers));

            expect(yield* countTransactions()).toBe(3);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('backfills a source added after the integration last synced, which has no stored progress', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupBinanceFixture({
                asset: 'USDT',
                mode: SyncModeEnum.FORWARD,
                forwardSyncedAt: new Date(Date.now() - 5 * 60 * 1000)
            });
            binanceStub.dividends([
                buildBinance.dividend({ tranId: 8001, asset: 'USDT', amount: '1', divTime: Date.now() - 365 * DAY_MS })
            ]);

            yield* binanceSyncService.sync();

            expect(yield* countTransactions()).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each(FORWARD_SYNCED_SOURCES)('backfills a forward-synced $name source without progress once, without duplicates', source =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const { sync, token, nowMs, timesMs } = yield* seedBackfill(source, new Date(Date.now() - STALE_SYNC_AGE_MS));
            source.stub(timesMs, [], emptyFn);
            yield* binanceSyncService.sync();

            expect(yield* countTransactions()).toBe(2);
            expect((yield* fetchHistoryProgress(token))[source.key].tailAt).toBeLessThan(nowMs - 1800 * DAY_MS);

            expect(yield* resyncAndCollectWindows(source, timesMs, sync.id)).toEqual([]);
            expect(yield* countTransactions()).toBe(2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect(
        'commits newer windows and resumes from the failing window after a non-deferral failure',
        () =>
            Effect.gen(function* () {
                const binanceSyncService = yield* BinanceSyncService;
                const nowMs = Date.now();
                const rewards = [
                    buildBinance.earnReward({ asset: 'USDT', rewards: '1', time: nowMs - OLD_AGE_MS }),
                    buildBinance.earnReward({ asset: 'USDT', rewards: '1', time: nowMs - RECENT_AGE_MS })
                ];

                const { sync, token } = yield* setupBackfillFixture(false);
                binanceStub.earnRewards(rewards, [], { failAfter: FAILING_AT_REQUEST - 1, failTimes: FAILURES_EXHAUSTING_CLIENT_RETRIES });
                yield* binanceSyncService.sync();

                const failedTailAt = (yield* fetchHistoryProgress(token))['EARN'].tailAt;
                expect(yield* countTransactions()).toBe(1);
                expect(failedTailAt).toBeLessThan(nowMs - 60 * DAY_MS);
                expect(failedTailAt).toBeGreaterThan(nowMs - 1000 * DAY_MS);

                const resumedWindows: TimeWindow[] = [];
                binanceStub.earnRewards(rewards, resumedWindows);
                yield* resyncBinance(sync.id);

                expect(yield* countTransactions()).toBe(2);
                expect((yield* fetchHistoryProgress(token))['EARN'].tailAt).toBeLessThan(nowMs - 1800 * DAY_MS);
                expect(
                    resumedWindows.filter(window => window.startMs > failedTailAt + 1000 && window.startMs < nowMs - 3 * DAY_MS)
                ).toEqual([]);
            }).pipe(Effect.provide(TestLayer)),
        RETRY_BACKOFF_TIMEOUT_MS
    );

    it.effect('requests adjacent history windows without sharing a boundary millisecond', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const requestedWindows: TimeWindow[] = [];
            yield* setupBinanceFixture();
            binanceStub.deposits([], requestedWindows);

            yield* binanceSyncService.sync();

            expect(requestedWindows.length).toBeGreaterThan(1);
            for (const [index, window] of requestedWindows.slice(1).entries()) {
                expect(window.endMs).toBe(requestedWindows[index].startMs - 1);
            }
        }).pipe(Effect.provide(TestLayer))
    );
});
