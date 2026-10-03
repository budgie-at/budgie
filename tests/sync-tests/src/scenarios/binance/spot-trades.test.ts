import { AccountEntityTable, SyncModeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { BinanceSignedClient, BinanceSyncService, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    BINANCE_TEST_TOKEN,
    BINANCE_WINDOW_FROM,
    BINANCE_WINDOW_TO,
    binanceStub,
    buildBinance,
    expectNoDuplicateAfterResync,
    expectSingleBinanceTransaction,
    fetchBinanceEntriesByExternalId,
    fetchBinanceTransactions,
    seedCryptoInstrument,
    setupAdaUsdtFixture,
    setupBinanceFixture,
    setupUsdtSpotFixtureWithBalances,
    testDb,
    TestLayer
} from '../../harness';
const RECURRING_SYNC_AGE_MS = 5 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MILLISECONDS_PER_SECOND = 1000;
const HTTP_BAD_REQUEST_STATUS = 400;
const stubAdaUsdtTradeWithCommissionAsset = (id: number, commissionAsset: string): void => {
    binanceStub.myTrades({
        ADAUSDT: [
            buildBinance.trade({
                symbol: 'ADAUSDT',
                id,
                qty: '200',
                quoteQty: '100',
                commission: '0.01',
                commissionAsset,
                isBuyer: true
            })
        ]
    });
};
const stubAdaUsdtTrade = (id: number, qty: string, quoteQty: string, isBuyer: boolean): void => {
    binanceStub.myTrades({
        ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id, qty, quoteQty, commission: '0', isBuyer })]
    });
};
const setupUsdtAdaBnbFixture = (bnbFree: string) =>
    Effect.gen(function* () {
        yield* setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: '100' }),
            buildBinance.balance({ asset: 'ADA', free: '200' }),
            buildBinance.balance({ asset: 'BNB', free: bnbFree })
        ]);
    });
const stubSpotTransferErrorScenario = (apiError: Parameters<typeof binanceStub.myTradesFailure>[1]): void => {
    binanceStub.serverTime();
    binanceStub.convertTradeFlow([]);
    binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '100' }), buildBinance.balance({ asset: 'ADA', free: '200' })]);
    binanceStub.deposits([]);
    binanceStub.withdrawals([]);
    binanceStub.c2cOrders([], []);
    binanceStub.exchangeInfo(['ADAUSDT']);
    binanceStub.myTradesFailure(HTTP_BAD_REQUEST_STATUS, apiError);
};
describe('binance/spot-trades', () => {
    it.effect('starts recurring myTrades requests at the sync window instead of restarting from trade ID zero', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const now = new Date();
            const forwardSyncedAt = new Date(now.getTime() - RECURRING_SYNC_AGE_MS);
            yield* seedCryptoInstrument('ADA');
            yield* setupAdaUsdtFixture(SyncModeEnum.FORWARD, forwardSyncedAt);
            const requestedUrls: URL[] = [];
            binanceStub.myTrades(
                {
                    ADAUSDT: [
                        buildBinance.trade({
                            symbol: 'ADAUSDT',
                            id: 9,
                            qty: '1',
                            quoteQty: '1',
                            isBuyer: true,
                            time: now.getTime(),
                            commission: '0'
                        })
                    ]
                },
                new Set<string>(),
                requestedUrls
            );
            yield* binanceSyncService.sync();
            expect(requestedUrls.length).toBeGreaterThan(0);
            expect(requestedUrls[0].searchParams.has('fromId')).toBe(false);
            expect(Number(requestedUrls[0].searchParams.get('startTime'))).toBe(
                Math.floor((forwardSyncedAt.getTime() - DAY_MS) / MILLISECONDS_PER_SECOND) * MILLISECONDS_PER_SECOND
            );
        }).pipe(Effect.provide(TestLayer))
    );
});
describe('binance/spot-trades/mapping', () => {
    it.effect('maps a buy fill to a TRANSFER with quote-out CREDIT and base-in DEBIT at exchangeRate 1', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ADA');
            yield* setupUsdtSpotFixtureWithBalances('ADA', '200');
            stubAdaUsdtTrade(10, '200', '100', true);
            yield* binanceSyncService.sync();
            yield* expectSingleBinanceTransaction(TransactionTypeEnum.TRANSFER, 'binance:trade:ADAUSDT:10');
            expect((yield* fetchBinanceTransactions())[0].exchangeRate).toBe(1);
            const entries = yield* fetchBinanceEntriesByExternalId('binance:trade:ADAUSDT:10');
            expect(entries).toHaveLength(2);
            const creditEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
            const debitEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
            expect(creditEntry?.exchangeRate).toBe(1);
            expect(debitEntry?.exchangeRate).toBe(1);
        }).pipe(Effect.provide(TestLayer))
    );
    it.effect('maps a sell fill to a TRANSFER with base-out and quote-in', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ADA');
            yield* setupUsdtSpotFixtureWithBalances('ADA', '50');
            stubAdaUsdtTrade(11, '150', '75', false);
            yield* binanceSyncService.sync();
            yield* expectSingleBinanceTransaction(TransactionTypeEnum.TRANSFER, 'binance:trade:ADAUSDT:11');
        }).pipe(Effect.provide(TestLayer))
    );
    it.effect('adds a FEE entry on the BNB account when the commission asset is BNB', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ADA');
            yield* seedCryptoInstrument('BNB');
            yield* setupUsdtAdaBnbFixture('1');
            stubAdaUsdtTradeWithCommissionAsset(12, 'BNB');
            yield* binanceSyncService.sync();
            const entries = yield* fetchBinanceEntriesByExternalId('binance:trade:ADAUSDT:12');
            const feeEntries = yield* fetchBinanceEntriesByExternalId('binance:trade:ADAUSDT:12:fee');
            expect(entries).toHaveLength(2);
            expect(feeEntries).toHaveLength(1);
            expect(feeEntries[0].type).toBe(TransactionEntryTypeEnum.FEE);
        }).pipe(Effect.provide(TestLayer))
    );
    it.effect('omits a positive FEE entry when the commission asset account cannot be resolved', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ADA');
            yield* setupBinanceFixture({ asset: 'USDT' });
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'USDT', free: '100' }),
                buildBinance.balance({ asset: 'ADA', free: '200' })
            ]);
            stubAdaUsdtTradeWithCommissionAsset(24, 'NOPE');
            yield* binanceSyncService.sync();
            expect(yield* fetchBinanceEntriesByExternalId('binance:trade:ADAUSDT:24')).toHaveLength(2);
            expect(yield* fetchBinanceEntriesByExternalId('binance:trade:ADAUSDT:24:fee')).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
    it.effect('auto-creates the counter account for the bought asset when no Budgie account exists yet', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ADA');
            yield* setupUsdtSpotFixtureWithBalances('ADA', '200');
            stubAdaUsdtTrade(13, '200', '100', true);
            const adaCodecId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'ADA' });
            expect(yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, adaCodecId))).toHaveLength(0);
            yield* binanceSyncService.sync();
            const transactions = yield* fetchBinanceTransactions();
            expect(transactions).toHaveLength(1);
            expect(transactions[0].type).toBe(TransactionTypeEnum.TRANSFER);
            expect(yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, adaCodecId))).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
    it.effect('skips a trade whose counter-asset has no instrument (parked leg)', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupBinanceFixture({ asset: 'USDT' });
            binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '100' })]);
            binanceStub.myTrades({
                NOPEUSDT: [buildBinance.trade({ symbol: 'NOPEUSDT', id: 14, qty: '5', quoteQty: '100', commission: '0', isBuyer: true })]
            });
            yield* binanceSyncService.sync();
            expect(yield* fetchBinanceTransactions()).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
describe('binance/spot-trades/symbols', () => {
    it.effect('discovers only locally resolvable sold-off base asset trades through selected quote balances and exchangeInfo', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ADA');
            yield* setupBinanceFixture({ asset: 'USDT' });
            binanceStub.exchangeInfo(['ADAUSDT', 'DOGEUSDT', 'PEPEUSDT', 'XRPUSDT']);
            binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '100' })]);
            const requestedSymbols = new Set<string>();
            binanceStub.myTrades(
                {
                    ADAUSDT: [
                        buildBinance.trade({ symbol: 'ADAUSDT', id: 18, qty: '200', quoteQty: '100', commission: '0', isBuyer: true }),
                        buildBinance.trade({ symbol: 'ADAUSDT', id: 19, qty: '200', quoteQty: '120', commission: '0', isBuyer: false })
                    ]
                },
                requestedSymbols
            );
            yield* binanceSyncService.sync();
            const externalIds = (yield* fetchBinanceTransactions()).map(transaction => transaction.externalId).sort();
            expect([...requestedSymbols]).toEqual(['ADAUSDT']);
            expect(externalIds).toEqual(['binance:trade:ADAUSDT:18', 'binance:trade:ADAUSDT:19']);
        }).pipe(Effect.provide(TestLayer))
    );
    it.effect('returns trades for all accounts in a single run, not just the first account', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ADA');
            yield* seedCryptoInstrument('BNB');
            yield* setupUsdtAdaBnbFixture('5');
            binanceStub.myTrades({
                ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id: 20, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })],
                BNBUSDT: [buildBinance.trade({ symbol: 'BNBUSDT', id: 21, qty: '5', quoteQty: '50', commission: '0', isBuyer: true })]
            });
            yield* binanceSyncService.sync();
            const transactions = yield* fetchBinanceTransactions();
            const externalIds = transactions.map(transaction => transaction.externalId);
            expect(externalIds).toContain('binance:trade:ADAUSDT:20');
            expect(externalIds).toContain('binance:trade:BNBUSDT:21');
        }).pipe(Effect.provide(TestLayer))
    );
    it.effect('only queries myTrades for symbols present in exchangeInfo', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ADA');
            yield* setupBinanceFixture({ asset: 'USDT' });
            binanceStub.exchangeInfo(['ADAUSDT']);
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'USDT', free: '100' }),
                buildBinance.balance({ asset: 'ADA', free: '200' })
            ]);
            const requestedSymbols = new Set<string>();
            binanceStub.myTrades(
                {
                    ADAUSDT: [
                        buildBinance.trade({ symbol: 'ADAUSDT', id: 22, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })
                    ]
                },
                requestedSymbols
            );
            yield* binanceSyncService.sync();
            expect([...requestedSymbols]).toEqual(['ADAUSDT']);
            expect(requestedSymbols.has('ADABTC')).toBe(false);
            expect(requestedSymbols.has('ADABNB')).toBe(false);
            expect(yield* fetchBinanceTransactions()).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
    it.effect('treats Simple Earn-looking asset codes as authoritative spot assets', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ADA');
            yield* setupBinanceFixture({ asset: 'USDT' });
            binanceStub.exchangeInfo(['ADAUSDT', 'LDADAUSDT', 'LDADABTC']);
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'USDT', free: '100' }),
                buildBinance.balance({ asset: 'ADA', free: '200' }),
                buildBinance.balance({ asset: 'LDADA', free: '500' })
            ]);
            const requestedSymbols = new Set<string>();
            binanceStub.myTrades(
                {
                    ADAUSDT: [
                        buildBinance.trade({ symbol: 'ADAUSDT', id: 23, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })
                    ]
                },
                requestedSymbols
            );
            yield* binanceSyncService.sync();
            expect(requestedSymbols.has('ADAUSDT')).toBe(true);
            expect(requestedSymbols.has('LDADAUSDT')).toBe(true);
            expect(requestedSymbols.has('LDADABTC')).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );
});
describe('binance/spot-trades/errors', () => {
    const fetchSpotTransfers = () =>
        new BinanceSignedClient(BINANCE_TEST_TOKEN).getTransfers(
            encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'USDT' }),
            BINANCE_WINDOW_FROM,
            BINANCE_WINDOW_TO
        );

    it.effect('swallows only Binance invalid-symbol myTrades errors', () =>
        Effect.gen(function* () {
            stubSpotTransferErrorScenario({ code: -1121, msg: 'Invalid symbol.' });

            const transfers = yield* fetchSpotTransfers();

            expect(transfers).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('propagates other Binance myTrades 400 errors with the structured API code', () =>
        Effect.gen(function* () {
            stubSpotTransferErrorScenario({ code: -1100, msg: 'Illegal characters found in parameter.' });

            const error = yield* Effect.flip(fetchSpotTransfers());

            expect(error._tag).toBe('SyncInvalidResponseError');
            expect(error._tag === 'SyncInvalidResponseError' ? error.apiCode : null).toBe(-1100);
        }).pipe(Effect.provide(TestLayer))
    );
});
describe('binance/spot-trades/resync', () => {
    it.effect('does not create duplicate transfers on a second sync run', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ADA');
            yield* setupUsdtSpotFixtureWithBalances('ADA', '200');
            stubAdaUsdtTrade(15, '200', '100', true);
            yield* binanceSyncService.sync();
            yield* expectNoDuplicateAfterResync(() => {
                binanceStub.spotBalances([
                    buildBinance.balance({ asset: 'USDT', free: '100' }),
                    buildBinance.balance({ asset: 'ADA', free: '200' })
                ]);
                stubAdaUsdtTrade(15, '200', '100', true);
            });
        }).pipe(Effect.provide(TestLayer))
    );
});
