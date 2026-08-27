import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import {
    binanceStub,
    buildBinance,
    fetchBinanceTransactions,
    fetchSyncById,
    seedCryptoInstrument,
    setupBinanceFixture,
    setupUsdtSpotFixtureWithBalances,
    testDb
} from '../../harness';

import type { TimeWindow } from '../../harness';

const DAY_MS = 86_400_000;
const OLDER_CONVERT_ORDER_ID = 7101;
const NEWER_CONVERT_ORDER_ID = 7102;
const PROGRESS_CONVERT_ORDER_ID = 7201;
const OLDER_CONVERT_AGE_DAYS = 1000;
const NEWER_CONVERT_AGE_MS = 5_000;
const MIN_SPLIT_WINDOW_COUNT = 1;
const EXPECTED_CREATED_TRANSACTION_COUNT = 1;
const BACKFILL_STARTED_AT = new Date('2026-07-01T00:00:00.000Z');
const INTERRUPTED_PROGRESS_AT = new Date('2026-06-01T00:00:00.000Z');
const EXPECTED_BACKFILL_START_MS = new Date('2021-07-01T00:00:00.000Z').getTime();

const stubUsdtToBtcConvert = (orderId: number): void => {
    binanceStub.convertTradeFlow([
        buildBinance.convertFlow({ orderId, fromAsset: 'USDT', fromAmount: '100', toAsset: 'BTC', toAmount: '0.001' })
    ]);
};

describe('binance/convert-sync-progress', () => {
    it('continues fetching Convert history when Binance reports more data', async () => {
        const olderConvertTime = Date.now() - OLDER_CONVERT_AGE_DAYS * DAY_MS;
        const newerConvertTime = Date.now() - NEWER_CONVERT_AGE_MS;
        const requestedWindows: TimeWindow[] = [];
        seedCryptoInstrument('BTC');
        setupUsdtSpotFixtureWithBalances('BTC', '1');
        binanceStub.convertTradeFlow(
            [
                buildBinance.convertFlow({
                    orderId: OLDER_CONVERT_ORDER_ID,
                    fromAsset: 'USDT',
                    fromAmount: '100',
                    toAsset: 'BTC',
                    toAmount: '0.001',
                    createTime: olderConvertTime
                }),
                buildBinance.convertFlow({
                    orderId: NEWER_CONVERT_ORDER_ID,
                    fromAsset: 'USDT',
                    fromAmount: '200',
                    toAsset: 'BTC',
                    toAmount: '0.002',
                    createTime: newerConvertTime
                })
            ],
            requestedWindows,
            true
        );

        await binanceSyncService.sync();

        const externalIds = fetchBinanceTransactions()
            .map(transaction => transaction.externalId)
            .sort();
        expect(externalIds).toEqual(['binance:convert:7101', 'binance:convert:7102']);
        expect(requestedWindows.length).toBeGreaterThan(MIN_SPLIT_WINDOW_COUNT);
    });

    it('increments Binance sync transaction count for created Convert transfers', async () => {
        seedCryptoInstrument('BTC');
        const { sync } = setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '100' }), buildBinance.balance({ asset: 'BTC', free: '1' })]);
        stubUsdtToBtcConvert(PROGRESS_CONVERT_ORDER_ID);

        await binanceSyncService.sync();

        expect(fetchSyncById(sync.id).transactionCount).toBe(EXPECTED_CREATED_TRANSACTION_COUNT);
    });

    it('resumes an interrupted first backfill from its original floor for sources and transfers', async () => {
        const sourceWindows: TimeWindow[] = [];
        const transferWindows: TimeWindow[] = [];
        const { sync } = setupBinanceFixture({ asset: 'USDT', backwardSyncFromAt: BACKFILL_STARTED_AT });
        testDb.update(SyncEntityTable).set({ backwardSyncedAt: INTERRUPTED_PROGRESS_AT }).where(eq(SyncEntityTable.id, sync.id)).run();
        binanceStub.deposits([], sourceWindows);
        binanceStub.convertTradeFlow([], transferWindows);

        await binanceSyncService.sync();

        expect(Math.min(...sourceWindows.map(window => window.startMs))).toBe(EXPECTED_BACKFILL_START_MS);
        expect(Math.min(...transferWindows.map(window => window.startMs))).toBe(EXPECTED_BACKFILL_START_MS);
    });
});
