import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncModeEnum, ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { binanceStub, buildBinance, setupBinanceFixture, testDb } from '../../harness';

import type { TimeWindow } from '../../harness';

const DAY_MS = 86_400_000;
const POST_GAP_ORDER_AGE_MS = 150 * DAY_MS;
const FIAT_DORMANCY_MAX_AGE_MS = 200 * DAY_MS;

const fetchExternalIds = () =>
    testDb
        .select()
        .from(TransactionEntityTable)
        .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE))
        .all()
        .map(transaction => transaction.externalId);

describe('binance/source-window-walk', () => {
    it('collects a C2C order older than the dormancy gap (walks to the history floor)', async () => {
        setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.BACKWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
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
            []
        );

        await binanceSyncService.sync();

        expect(fetchExternalIds()).toContain('binance:c2c:post-gap-p2p');
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
});
