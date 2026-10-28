import {
    BankIntegrationEntityTable,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    SyncEntityTable,
    SyncModeEnum,
    SyncStatusEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';
import { expect } from 'vitest';

import { testDb } from '../scenario/setup';
import { seed } from '../seed/seed';

import { RUN_DEADLINE_MS, STALE_SYNC_AGE_MS } from './binance-clock';
import { binanceStub } from './binance-stub';
import { buildBinance } from './build-binance';
import { setupBinanceFixture } from './setup-binance-fixture';

import type { BinanceAssetBalanceApiInterface } from '@budgie/sync';

const EARN_DAY_KEY_LENGTH = 10;
const DEFAULT_RECENT_DAY_OF_MONTH = 15;
const SPOT_QUOTE_FREE = '100';
const decodeHistoryProgress = Schema.decodeUnknownSync(
    Schema.fromJsonString(Schema.Record(Schema.String, Schema.Struct({ headAt: Schema.Number, tailAt: Schema.Number })))
);

export const fetchHistoryProgress = (token: string) =>
    Effect.gen(function* () {
        const [integration] = yield* testDb.select().from(BankIntegrationEntityTable).where(eq(BankIntegrationEntityTable.token, token));

        return decodeHistoryProgress(integration.historyProgress ?? '{}');
    });

export const fetchBinanceTransactions = () =>
    Effect.gen(function* () {
        return yield* testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE));
    });

export const fetchSortedBinanceExternalIds = () =>
    Effect.map(fetchBinanceTransactions(), transactions =>
        transactions.map(transaction => transaction.externalId).sort((left, right) => (left ?? '').localeCompare(right ?? ''))
    );

export const fetchBinanceEntriesByExternalId = (externalId: string) =>
    Effect.gen(function* () {
        return yield* testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.externalId, externalId));
    });

export const seedCryptoInstrument = (code: string) =>
    Effect.gen(function* () {
        return yield* seed.instrument({ code, name: code, symbol: code, type: InstrumentTypeEnum.CRYPTO });
    });

export const setupAdaUsdtFixture = (
    mode: SyncModeEnum,
    forwardSyncedAt?: Date,
    binanceTradeCursor?: string,
    baseAssets: readonly string[] = ['ADA']
) =>
    Effect.gen(function* () {
        const fixture = yield* setupBinanceFixture({ asset: 'USDT', mode, forwardSyncedAt, binanceTradeCursor });

        binanceStub.exchangeInfo(baseAssets.map(baseAsset => `${baseAsset}USDT`));
        binanceStub.spotBalances([
            ...baseAssets.map(baseAsset => buildBinance.balance({ asset: baseAsset, free: '200' })),
            buildBinance.balance({ asset: 'USDT', free: '100' })
        ]);

        return fixture;
    });

export const setupStaleForwardFixture = (baseAssets: readonly string[] = ['ADA']) =>
    Effect.gen(function* () {
        yield* Effect.forEach(baseAssets, seedCryptoInstrument);

        return yield* setupAdaUsdtFixture(SyncModeEnum.FORWARD, new Date(Date.now() - STALE_SYNC_AGE_MS), undefined, baseAssets);
    });

export const setupUsdtSpotFixtureWithBalances = (baseAsset: string, baseFree: string) =>
    Effect.gen(function* () {
        const fixture = yield* setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: SPOT_QUOTE_FREE }),
            buildBinance.balance({ asset: baseAsset, free: baseFree })
        ]);

        return fixture;
    });

export const expectSingleBinanceTransaction = (transactionType: TransactionTypeEnum, externalId: string) =>
    Effect.gen(function* () {
        const transactions = yield* fetchBinanceTransactions();

        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(transactionType);
        expect(transactions[0].externalId).toBe(externalId);
    });

export const buildEarnDayKey = (timeMs: number): string => new Date(timeMs).toISOString().slice(0, EARN_DAY_KEY_LENGTH);

export const recentDayInMonthsAgo = (monthsAgo: number): number => {
    const now = new Date();
    const dayInMonth = monthsAgo === 0 ? 1 : DEFAULT_RECENT_DAY_OF_MONTH;

    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, dayInMonth);
};

export const stubBinanceAccountEndpoints = (spotBalances: BinanceAssetBalanceApiInterface[]): void => {
    binanceStub.serverTime();
    binanceStub.spotBalances(spotBalances);
    binanceStub.fundingBalances([]);
    binanceStub.earnPositions([]);
    binanceStub.lockedEarnPositions([]);
};

export const stubEmptyBinanceBalances = (): void => {
    binanceStub.spotBalances([]);
    binanceStub.fundingBalances([]);
};

export const resetBinanceSyncForResync = (): void => {
    binanceStub.serverTime();
};

export const expectNoDuplicateAfterResync = Effect.fnUntraced(function* (restubForResync: () => void) {
    const binanceSyncService = yield* BinanceSyncService;

    expect(yield* fetchBinanceTransactions()).toHaveLength(1);

    resetBinanceSyncForResync();
    restubForResync();
    yield* binanceSyncService.sync();

    expect(yield* fetchBinanceTransactions()).toHaveLength(1);
});

export const setupFiatScenario = (mode = SyncModeEnum.FORWARD) =>
    Effect.gen(function* () {
        const fixture = yield* setupBinanceFixture({ mode, asset: 'EUR', instrumentType: InstrumentTypeEnum.FIAT });

        return fixture;
    });

export const resyncBinance = (syncId: number, isDeadlineBound = false) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;

        resetBinanceSyncForResync();
        yield* testDb
            .update(SyncEntityTable)
            .set({ forwardSyncedAt: new Date(Date.now() - STALE_SYNC_AGE_MS), status: SyncStatusEnum.IDLE })
            .where(eq(SyncEntityTable.id, syncId));
        yield* isDeadlineBound ? binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS) : binanceSyncService.sync();
    });

export const fetchFiatOrderEntries = (orderNo: string) =>
    Effect.gen(function* () {
        const mainEntries = yield* fetchBinanceEntriesByExternalId(orderNo);
        const feeEntries = yield* fetchBinanceEntriesByExternalId(`${orderNo}:fee`);

        return { mainEntries, feeEntries };
    });
