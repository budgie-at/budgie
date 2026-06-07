import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/bank-sync';
import {
    AccountEntityTable,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { binanceStub, buildBinance, seed, setupBinanceFixture, testDb } from '../../harness';

const fetchTransactions = () =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE)).all();

const fetchEntriesByExternalId = (externalId: string) =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.externalId, externalId)).all();

const seedInstrument = (code: string) => seed.instrument({ code, name: code, symbol: code, type: InstrumentTypeEnum.CRYPTO });

describe('binance/spot-trades', () => {
    it('maps a buy fill to a TRANSFER with quote-out CREDIT and base-in DEBIT at exchangeRate 1', async () => {
        seedInstrument('ADA');
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: '100' }),
            buildBinance.balance({ asset: 'ADA', free: '200' })
        ]);
        binanceStub.myTrades({
            ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id: 10, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })]
        });

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionTypeEnum.TRANSFER);
        expect(transactions[0].externalId).toBe('binance:trade:ADAUSDT:10');
        expect(transactions[0].exchangeRate).toBe(1);

        const entries = fetchEntriesByExternalId('binance:trade:ADAUSDT:10');
        expect(entries).toHaveLength(2);
        const creditEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);
        const debitEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.DEBIT);
        expect(creditEntry?.exchangeRate).toBe(1);
        expect(debitEntry?.exchangeRate).toBe(1);
    });

    it('maps a sell fill to a TRANSFER with base-out and quote-in', async () => {
        seedInstrument('ADA');
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: '100' }),
            buildBinance.balance({ asset: 'ADA', free: '50' })
        ]);
        binanceStub.myTrades({
            ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id: 11, qty: '150', quoteQty: '75', commission: '0', isBuyer: false })]
        });

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionTypeEnum.TRANSFER);
        expect(transactions[0].externalId).toBe('binance:trade:ADAUSDT:11');
    });

    it('adds a FEE entry on the BNB account when the commission asset is BNB', async () => {
        seedInstrument('ADA');
        seedInstrument('BNB');
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: '100' }),
            buildBinance.balance({ asset: 'ADA', free: '200' }),
            buildBinance.balance({ asset: 'BNB', free: '1' })
        ]);
        binanceStub.myTrades({
            ADAUSDT: [
                buildBinance.trade({
                    symbol: 'ADAUSDT',
                    id: 12,
                    qty: '200',
                    quoteQty: '100',
                    commission: '0.01',
                    commissionAsset: 'BNB',
                    isBuyer: true
                })
            ]
        });

        await binanceSyncService.sync();

        const entries = fetchEntriesByExternalId('binance:trade:ADAUSDT:12');
        const feeEntries = fetchEntriesByExternalId('binance:trade:ADAUSDT:12:fee');
        expect(entries).toHaveLength(2);
        expect(feeEntries).toHaveLength(1);
        expect(feeEntries[0].type).toBe(TransactionEntryTypeEnum.FEE);
    });

    it('auto-creates the counter account for the bought asset when no Budgie account exists yet', async () => {
        seedInstrument('ADA');
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: '100' }),
            buildBinance.balance({ asset: 'ADA', free: '200' })
        ]);
        binanceStub.myTrades({
            ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id: 13, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })]
        });

        const adaCodecId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'ADA' });
        expect(testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, adaCodecId)).all()).toHaveLength(0);

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionTypeEnum.TRANSFER);
        expect(testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, adaCodecId)).all()).toHaveLength(1);
    });

    it('skips a trade whose counter-asset has no instrument (parked leg)', async () => {
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '100' })]);
        binanceStub.myTrades({
            NOPEUSDT: [buildBinance.trade({ symbol: 'NOPEUSDT', id: 14, qty: '5', quoteQty: '100', commission: '0', isBuyer: true })]
        });

        await binanceSyncService.sync();

        expect(fetchTransactions()).toHaveLength(0);
    });

    it('returns trades for all accounts in a single run, not just the first account', async () => {
        seedInstrument('ADA');
        seedInstrument('BNB');
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: '100' }),
            buildBinance.balance({ asset: 'ADA', free: '200' }),
            buildBinance.balance({ asset: 'BNB', free: '5' })
        ]);
        binanceStub.myTrades({
            ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id: 20, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })],
            BNBUSDT: [buildBinance.trade({ symbol: 'BNBUSDT', id: 21, qty: '5', quoteQty: '50', commission: '0', isBuyer: true })]
        });

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        const externalIds = transactions.map(transaction => transaction.externalId);
        expect(externalIds).toContain('binance:trade:ADAUSDT:20');
        expect(externalIds).toContain('binance:trade:BNBUSDT:21');
    });

    it('only queries myTrades for symbols present in exchangeInfo', async () => {
        seedInstrument('ADA');
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.exchangeInfo(['ADAUSDT']);
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: '100' }),
            buildBinance.balance({ asset: 'ADA', free: '200' })
        ]);
        const requestedSymbols = new Set<string>();
        binanceStub.myTradesTracked(
            { ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id: 22, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })] },
            requestedSymbols
        );

        await binanceSyncService.sync();

        expect([...requestedSymbols]).toEqual(['ADAUSDT']);
        expect(requestedSymbols.has('ADABTC')).toBe(false);
        expect(requestedSymbols.has('ADABNB')).toBe(false);
        expect(fetchTransactions()).toHaveLength(1);
    });

    it('does not query myTrades for LD* Simple Earn assets', async () => {
        seedInstrument('ADA');
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.exchangeInfo(['ADAUSDT', 'LDADAUSDT', 'LDADABTC']);
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: '100' }),
            buildBinance.balance({ asset: 'ADA', free: '200' }),
            buildBinance.balance({ asset: 'LDADA', free: '500' })
        ]);
        const requestedSymbols = new Set<string>();
        binanceStub.myTradesTracked(
            { ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id: 23, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })] },
            requestedSymbols
        );

        await binanceSyncService.sync();

        const ldSymbolsQueried = [...requestedSymbols].filter(symbol => symbol.startsWith('LD'));
        expect(ldSymbolsQueried).toEqual([]);
        expect(requestedSymbols.has('ADAUSDT')).toBe(true);
    });

    it('does not create duplicate transfers on a second sync run', async () => {
        seedInstrument('ADA');
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: '100' }),
            buildBinance.balance({ asset: 'ADA', free: '200' })
        ]);
        binanceStub.myTrades({
            ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id: 15, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })]
        });

        await binanceSyncService.sync();
        expect(fetchTransactions()).toHaveLength(1);

        Object.assign(binanceSyncService, { isRunning: false });
        binanceStub.serverTime();
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: '100' }),
            buildBinance.balance({ asset: 'ADA', free: '200' })
        ]);
        binanceStub.myTrades({
            ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id: 15, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })]
        });
        await binanceSyncService.sync();

        expect(fetchTransactions()).toHaveLength(1);
    });
});
