import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { ExternalSourceEnum, SyncEntityTable, SyncModeEnum, SyncStatusEnum, TransactionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { binanceStub, buildBinance, resetBinanceSyncForResync, setupBinanceFixture, testDb } from '../../harness';

import type { TimeWindow } from '../../harness';

const DAY_MS = 86_400_000;
const POST_GAP_ORDER_AGE_MS = 150 * DAY_MS;
const FIAT_DORMANCY_MAX_AGE_MS = 200 * DAY_MS;
const STALE_FORWARD_SYNC_AGE_MS = 5 * 60 * 1000;

const fetchExternalIds = () =>
    testDb
        .select()
        .from(TransactionEntityTable)
        .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE))
        .all()
        .map(transaction => transaction.externalId);

describe('binance/source-window-walk', () => {
    it('collects available C2C history without requesting beyond the Binance six-month limit', async () => {
        setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.BACKWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
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

        await binanceSyncService.sync();

        expect(fetchExternalIds()).toContain('binance:c2c:post-gap-p2p');
        expect(Math.min(...requestedWindows.map(window => window.startMs))).toBeGreaterThan(Date.now() - FIAT_DORMANCY_MAX_AGE_MS);
    });

    it('stops walking fiat windows after the dormancy gap when there are no fiat orders', async () => {
        setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.BACKWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
        const requestedWindows: TimeWindow[] = [];
        binanceStub.fiatOrders([], [], requestedWindows);

        await binanceSyncService.sync();

        expect(requestedWindows.length).toBeGreaterThan(0);
        const oldestRequestedStartMs = Math.min(...requestedWindows.map(window => window.startMs));
        expect(Date.now() - oldestRequestedStartMs).toBeLessThan(FIAT_DORMANCY_MAX_AGE_MS);
    });

    it('does not spend the fiat UID budget again during the daily refresh interval', async () => {
        const staleForwardSync = new Date(Date.now() - STALE_FORWARD_SYNC_AGE_MS);
        const { sync } = setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD, forwardSyncedAt: staleForwardSync });
        const requestedWindows: TimeWindow[] = [];
        binanceStub.fiatOrders([], [], requestedWindows);

        await binanceSyncService.sync();
        const firstRunRequestCount = requestedWindows.length;

        resetBinanceSyncForResync();
        testDb
            .update(SyncEntityTable)
            .set({ forwardSyncedAt: staleForwardSync, status: SyncStatusEnum.IDLE })
            .where(eq(SyncEntityTable.id, sync.id))
            .run();
        await binanceSyncService.sync();

        expect(firstRunRequestCount).toBeGreaterThan(0);
        expect(requestedWindows).toHaveLength(firstRunRequestCount);
    });

    it('finishes transfer requests before spending the heavyweight fiat UID budget', async () => {
        setupBinanceFixture({
            asset: 'USDT',
            mode: SyncModeEnum.FORWARD,
            forwardSyncedAt: new Date(Date.now() - STALE_FORWARD_SYNC_AGE_MS)
        });
        const requestOrder: string[] = [];
        binanceStub.convertTradeFlow([], [], false, requestOrder);
        binanceStub.fiatOrders([], [], [], requestOrder);

        await binanceSyncService.sync();

        expect(requestOrder.indexOf('convert')).toBeLessThan(requestOrder.indexOf('fiat'));
    });
});
