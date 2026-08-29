import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import {
    ExternalSourceEnum,
    InstrumentTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { expect } from 'vitest';

import { testDb } from '../scenario/setup';
import { seed } from '../seed/seed';

import { binanceStub } from './binance-stub';
import { buildBinance } from './build-binance';
import { setupBinanceFixture } from './setup-binance-fixture';

const EARN_DAY_KEY_LENGTH = 10;
const DEFAULT_RECENT_DAY_OF_MONTH = 15;
const SPOT_QUOTE_FREE = '100';

export const fetchBinanceTransactions = () =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE)).all();

export const fetchBinanceEntriesByExternalId = (externalId: string) =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.externalId, externalId)).all();

export const seedCryptoInstrument = (code: string) => seed.instrument({ code, name: code, symbol: code, type: InstrumentTypeEnum.CRYPTO });

export const setupUsdtSpotFixtureWithBalances = (baseAsset: string, baseFree: string): void => {
    setupBinanceFixture({ asset: 'USDT' });
    binanceStub.spotBalances([
        buildBinance.balance({ asset: 'USDT', free: SPOT_QUOTE_FREE }),
        buildBinance.balance({ asset: baseAsset, free: baseFree })
    ]);
};

export const expectSingleBinanceTransaction = (transactionType: TransactionTypeEnum, externalId: string): void => {
    const transactions = fetchBinanceTransactions();

    expect(transactions).toHaveLength(1);
    expect(transactions[0].type).toBe(transactionType);
    expect(transactions[0].externalId).toBe(externalId);
};

export const buildEarnDayKey = (timeMs: number): string => new Date(timeMs).toISOString().slice(0, EARN_DAY_KEY_LENGTH);

export const recentDayInMonthsAgo = (monthsAgo: number): number => {
    const now = new Date();
    const dayInMonth = monthsAgo === 0 ? 1 : DEFAULT_RECENT_DAY_OF_MONTH;

    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, dayInMonth);
};

export const stubEmptyBinanceBalances = (): void => {
    binanceStub.spotBalances([]);
    binanceStub.fundingBalances([]);
};

export const resetBinanceSyncForResync = (): void => {
    Object.assign(binanceSyncService, { isRunning: false });
    binanceStub.serverTime();
};

export const expectNoDuplicateAfterResync = async (restubForResync: () => void): Promise<void> => {
    expect(fetchBinanceTransactions()).toHaveLength(1);

    resetBinanceSyncForResync();
    restubForResync();
    await binanceSyncService.sync();

    expect(fetchBinanceTransactions()).toHaveLength(1);
};
