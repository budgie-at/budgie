import { ExternalSourceEnum, SyncEntityTable, SyncModeEnum, SyncStatusEnum, TransactionEntityTable } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { binanceStub, buildBinance, resetBinanceSyncForResync, setupBinanceFixture, testDb, TestLayer } from '../../harness';

import type { TimeWindow } from '../../harness';

const DAY_MS = 86_400_000;
const POST_GAP_ORDER_AGE_MS = 150 * DAY_MS;
const FIAT_DORMANCY_MAX_AGE_MS = 200 * DAY_MS;
const STALE_FORWARD_SYNC_AGE_MS = 5 * 60 * 1000;

const fetchExternalIds = () =>
    Effect.gen(function* () {
        return (yield* testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE))).map(transaction => transaction.externalId);
    });

const setupEmptyBackwardBinanceSync = () =>
    Effect.gen(function* () {
        yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.BACKWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
    });

describe('binance/source-window-walk', () => {
    it.effect('collects available C2C history without requesting beyond the Binance six-month limit', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupEmptyBackwardBinanceSync();
            const requestedWindows: TimeWindow[] = [];
            binanceStub.c2cOrders(
                [
                    buildBinance.c2cOrder({
                        orderNumber: 'post-gap-p2p',
                        tradeType: 'BUY',
                        asset: 'USDT',
                        amount: '100',
                        createTime: Date.now() - POST_GAP_ORDER_AGE_MS
                    })
                ],
                [],
                requestedWindows
            );

            yield* binanceSyncService.sync();

            expect(yield* fetchExternalIds()).toContain('binance:c2c:post-gap-p2p');
            expect(Math.min(...requestedWindows.map(window => window.startMs))).toBeGreaterThan(Date.now() - FIAT_DORMANCY_MAX_AGE_MS);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('stops walking fiat windows after the dormancy gap when there are no fiat orders', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupEmptyBackwardBinanceSync();
            const requestedWindows: TimeWindow[] = [];
            binanceStub.fiatOrders([], [], requestedWindows);

            yield* binanceSyncService.sync();

            expect(requestedWindows.length).toBeGreaterThan(0);
            const oldestRequestedStartMs = Math.min(...requestedWindows.map(window => window.startMs));
            expect(Date.now() - oldestRequestedStartMs).toBeLessThan(FIAT_DORMANCY_MAX_AGE_MS);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not spend the fiat UID budget again during the daily refresh interval', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const staleForwardSync = new Date(Date.now() - STALE_FORWARD_SYNC_AGE_MS);
            const { sync } = yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD, forwardSyncedAt: staleForwardSync });
            const requestedWindows: TimeWindow[] = [];
            binanceStub.fiatOrders([], [], requestedWindows);

            yield* binanceSyncService.sync();
            const firstRunRequestCount = requestedWindows.length;

            resetBinanceSyncForResync();
            yield* testDb
                .update(SyncEntityTable)
                .set({ forwardSyncedAt: staleForwardSync, status: SyncStatusEnum.IDLE })
                .where(eq(SyncEntityTable.id, sync.id));
            yield* binanceSyncService.sync();

            expect(firstRunRequestCount).toBeGreaterThan(0);
            expect(requestedWindows).toHaveLength(firstRunRequestCount);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('finishes transfer requests before spending the heavyweight fiat UID budget', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupBinanceFixture({
                asset: 'USDT',
                mode: SyncModeEnum.FORWARD,
                forwardSyncedAt: new Date(Date.now() - STALE_FORWARD_SYNC_AGE_MS)
            });
            const requestOrder: string[] = [];
            binanceStub.convertTradeFlow([], [], false, requestOrder);
            binanceStub.fiatOrders([], [], [], requestOrder);

            yield* binanceSyncService.sync();

            expect(requestOrder.indexOf('convert')).toBeLessThan(requestOrder.indexOf('fiat'));
        }).pipe(Effect.provide(TestLayer))
    );
});
