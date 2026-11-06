import {
    AccountBalanceEntityTable,
    AccountBalanceRepository,
    AccountTypeEnum,
    ExchangeRateEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    InstrumentTypeEnum,
    PRECISION,
    convertFromMicroUnits,
    convertToMicroUnits
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { ExchangeRateRepository } from '../src/exchange-rate/repository/exchange-rate.repository';
import { ExchangeRatesSyncService } from '../src/exchange-rate/service/exchange-rates-sync.service';
import { ExchangeRatesService } from '../src/exchange-rate/service/exchange-rates.service';
import { HistoricalExchangeRateRepository } from '../src/historical-exchange-rate/repository/historical-exchange-rate.repository';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';

import { makeFakeHttpClientLayer, setDefaultInstrument, TestLayer, testDb, testSeedService } from './test-context';

const seedPair = Effect.fnUntraced(function* (baseCode: string, quoteCode: string, type: InstrumentTypeEnum = InstrumentTypeEnum.FIAT) {
    const base = yield* testSeedService.instrument({ code: baseCode, name: baseCode, symbol: baseCode, type });
    const quote = yield* testSeedService.instrument({ code: quoteCode, name: quoteCode, symbol: quoteCode });

    return { base, quote };
});

describe('exchange rates', () => {
    it.effect('converts with a stored direct rate and its inverse', () =>
        Effect.gen(function* () {
            const exchangeRatesService = yield* ExchangeRatesService;
            const exchangeRateRepository = yield* ExchangeRateRepository;
            const { base, quote } = yield* seedPair('TA1', 'TB1');

            yield* exchangeRateRepository.bulkUpsert([
                { baseInstrumentId: base.id, quoteInstrumentId: quote.id, rate: 0.5, source: 'test' }
            ]);

            const direct = yield* exchangeRatesService.convertStrict(base.id, quote.id, 100 * PRECISION);
            const inverse = yield* exchangeRatesService.convertStrict(quote.id, base.id, 50 * PRECISION);

            expect(direct).toStrictEqual({ amount: 50 * PRECISION, exchangeRate: 0.5 });
            expect(inverse).toStrictEqual({ amount: 100 * PRECISION, exchangeRate: 2 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('falls back to the unchanged amount when no rate is stored', () =>
        Effect.gen(function* () {
            const exchangeRatesService = yield* ExchangeRatesService;
            const { base, quote } = yield* seedPair('TA2', 'TB2');

            const strict = yield* exchangeRatesService.convertStrict(base.id, quote.id, 100 * PRECISION);
            const lenient = yield* exchangeRatesService.convert(base.id, quote.id, 100 * PRECISION);

            expect(strict).toBeNull();
            expect(lenient).toStrictEqual({ amount: 100 * PRECISION, exchangeRate: 1 });
        }).pipe(Effect.provide(TestLayer))
    );

    it.live('stores fiat rates fetched through the HTTP client', () =>
        Effect.gen(function* () {
            const exchangeRatesService = yield* ExchangeRatesService;
            const exchangeRatesSyncService = yield* ExchangeRatesSyncService;
            const { base, quote } = yield* seedPair('TA6', 'TB6');

            yield* setDefaultInstrument(base.id);
            yield* exchangeRatesSyncService.sync();

            const conversion = yield* exchangeRatesService.convertStrict(base.id, quote.id, 10 * PRECISION);

            expect(conversion).toStrictEqual({ amount: 25 * PRECISION, exchangeRate: 2.5 });
        }).pipe(Effect.provide([TestLayer, makeFakeHttpClientLayer({ base: 'TA6', date: '2026-01-01', rates: { TB6: 2.5 } })]))
    );
});

describe('base valuation', () => {
    it.effect('values a fiat amount with the historical rate on or before the operation date', () =>
        Effect.gen(function* () {
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const historicalExchangeRateRepository = yield* HistoricalExchangeRateRepository;
            const { base, quote } = yield* seedPair('TA3', 'TB3');
            const account = yield* testSeedService.account({ instrumentId: quote.id });

            yield* setDefaultInstrument(base.id);
            yield* historicalExchangeRateRepository.bulkUpsert([
                {
                    sourceInstrumentId: quote.id,
                    targetInstrumentId: base.id,
                    rateDate: '2020-01-01',
                    rate: 0.03
                }
            ]);

            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: account.id,
                amount: 100 * PRECISION,
                operatedAt: new Date('2020-01-02T12:00:00.000Z')
            });

            expect(valuation).toStrictEqual({ baseInstrumentId: base.id, baseExchangeRate: 0.03, baseAmount: 3 * PRECISION });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('values a crypto amount with the stored rate and leaves it unvalued when no rate exists', () =>
        Effect.gen(function* () {
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const historicalExchangeRateRepository = yield* HistoricalExchangeRateRepository;
            const { base: coin, quote: base } = yield* seedPair('TA4', 'TB4', InstrumentTypeEnum.CRYPTO);
            const { base: unratedCoin } = yield* seedPair('TA5', 'TB5', InstrumentTypeEnum.CRYPTO);
            const account = yield* testSeedService.account({ instrumentId: coin.id, type: AccountTypeEnum.CRYPTO });
            const unratedAccount = yield* testSeedService.account({ instrumentId: unratedCoin.id, type: AccountTypeEnum.CRYPTO });

            yield* setDefaultInstrument(base.id);
            yield* historicalExchangeRateRepository.bulkUpsert([
                {
                    sourceInstrumentId: coin.id,
                    targetInstrumentId: base.id,
                    rateDate: '2020-01-01',
                    rate: 20_000
                }
            ]);

            const operatedAt = new Date('2020-06-01T12:00:00.000Z');
            const valued = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: account.id,
                amount: PRECISION / 2,
                operatedAt
            });
            const unvalued = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: unratedAccount.id,
                amount: PRECISION,
                operatedAt
            });

            expect(valued).toStrictEqual({ baseInstrumentId: base.id, baseExchangeRate: 20_000, baseAmount: 10_000 * PRECISION });
            expect(unvalued).toStrictEqual({ baseInstrumentId: null, baseExchangeRate: null, baseAmount: null });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('values a crypto account with its direct exchange rate', () =>
        Effect.gen(function* () {
            const exchangeRateRepository = yield* ExchangeRateRepository;
            const { base: bitcoin, quote } = yield* seedPair('TC1', 'TQ1', InstrumentTypeEnum.CRYPTO);

            yield* testSeedService.account({ instrumentId: bitcoin.id, type: AccountTypeEnum.CRYPTO });
            yield* exchangeRateRepository.bulkUpsert([
                { baseInstrumentId: bitcoin.id, quoteInstrumentId: quote.id, rate: 50_000, source: 'test' }
            ]);

            const rates = yield* exchangeRateRepository.findUnitAccountValuationRates(quote.id);

            expect(rates).toStrictEqual([{ instrumentId: bitcoin.id, rate: 50_000 }]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('values a crypto account with the inverse of a stored exchange rate', () =>
        Effect.gen(function* () {
            const exchangeRateRepository = yield* ExchangeRateRepository;
            const { base: bitcoin, quote } = yield* seedPair('TC2', 'TQ2', InstrumentTypeEnum.CRYPTO);

            yield* testSeedService.account({ instrumentId: bitcoin.id, type: AccountTypeEnum.CRYPTO });
            yield* exchangeRateRepository.bulkUpsert([
                { baseInstrumentId: quote.id, quoteInstrumentId: bitcoin.id, rate: 0.00004, source: 'test' }
            ]);

            const rates = yield* exchangeRateRepository.findUnitAccountValuationRates(quote.id);

            expect(rates).toHaveLength(1);
            expect(rates[0]?.rate).toBeCloseTo(25_000, 6);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores a soft-deleted exchange rate and falls back to the latest historical rate', () =>
        Effect.gen(function* () {
            const exchangeRateRepository = yield* ExchangeRateRepository;
            const historicalRepository = yield* HistoricalExchangeRateRepository;
            const { base: bitcoin, quote } = yield* seedPair('TC3', 'TQ3', InstrumentTypeEnum.CRYPTO);

            yield* testSeedService.account({ instrumentId: bitcoin.id, type: AccountTypeEnum.CRYPTO });
            yield* exchangeRateRepository.bulkUpsert([
                { baseInstrumentId: bitcoin.id, quoteInstrumentId: quote.id, rate: 99_999, source: 'test' }
            ]);
            yield* testDb
                .update(ExchangeRateEntityTable)
                .set({ deletedAt: new Date() })
                .where(eq(ExchangeRateEntityTable.baseInstrumentId, bitcoin.id));
            yield* historicalRepository.bulkUpsert([
                { sourceInstrumentId: bitcoin.id, targetInstrumentId: quote.id, rateDate: '2024-01-01', rate: 41_000 }
            ]);

            const rates = yield* exchangeRateRepository.findUnitAccountValuationRates(quote.id);

            expect(rates).toStrictEqual([{ instrumentId: bitcoin.id, rate: 41_000 }]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('falls back to the historical rate with the latest date', () =>
        Effect.gen(function* () {
            const exchangeRateRepository = yield* ExchangeRateRepository;
            const historicalRepository = yield* HistoricalExchangeRateRepository;
            const { base: bitcoin, quote } = yield* seedPair('TC4', 'TQ4', InstrumentTypeEnum.CRYPTO);

            yield* testSeedService.account({ instrumentId: bitcoin.id, type: AccountTypeEnum.CRYPTO });
            yield* historicalRepository.bulkUpsert([
                { sourceInstrumentId: bitcoin.id, targetInstrumentId: quote.id, rateDate: '2024-01-02', rate: 50_000 },
                { sourceInstrumentId: bitcoin.id, targetInstrumentId: quote.id, rateDate: '2024-01-01', rate: 40_000 }
            ]);

            const rates = yield* exchangeRateRepository.findUnitAccountValuationRates(quote.id);

            expect(rates.map(row => row.rate)).toStrictEqual([50_000]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('values each crypto account exactly as the home account rows convert it', () =>
        Effect.gen(function* () {
            const exchangeRateRepository = yield* ExchangeRateRepository;
            const historicalRepository = yield* HistoricalExchangeRateRepository;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { base: bitcoin, quote } = yield* seedPair('TC5', 'TQ5', InstrumentTypeEnum.CRYPTO);
            const { base: ether } = yield* seedPair('TC6', 'TQ6', InstrumentTypeEnum.CRYPTO);

            const bitcoinAccount = yield* testSeedService.account({ instrumentId: bitcoin.id, type: AccountTypeEnum.CRYPTO });
            const etherAccount = yield* testSeedService.account({ instrumentId: ether.id, type: AccountTypeEnum.CRYPTO });
            yield* exchangeRateRepository.bulkUpsert([
                { baseInstrumentId: bitcoin.id, quoteInstrumentId: quote.id, rate: 43_210.55, source: 'test' }
            ]);
            yield* historicalRepository.bulkUpsert([
                { sourceInstrumentId: ether.id, targetInstrumentId: quote.id, rateDate: '2024-01-01', rate: 2000 },
                { sourceInstrumentId: ether.id, targetInstrumentId: quote.id, rateDate: '2024-01-02', rate: 2345.67 }
            ]);
            yield* testDb.insert(AccountBalanceEntityTable).values([
                { accountId: bitcoinAccount.id, amount: convertToMicroUnits(0.37) },
                { accountId: etherAccount.id, amount: convertToMicroUnits(4.125) }
            ]);

            const rates = yield* exchangeRateRepository.findUnitAccountValuationRates(quote.id);
            const rows = yield* accountBalanceRepository.getHomeAccountRows(quote.id);

            for (const account of [bitcoinAccount, etherAccount]) {
                const rate = rates.find(row => row.instrumentId === account.instrumentId)?.rate;
                const row = rows.find(homeRow => homeRow.account.id === account.id);

                expect(rate).not.toBeNull();
                expect(row).toBeDefined();
                expect(Math.round(convertFromMicroUnits(row?.balance ?? 0) * (rate ?? 0) * 100)).toBe(
                    Math.round(convertFromMicroUnits(row?.convertedBalance ?? 0) * 100)
                );
            }

            expect(rows.find(homeRow => homeRow.account.id === etherAccount.id)?.convertedBalance).toBeGreaterThan(0);
        }).pipe(Effect.provide([TestLayer, AccountBalanceRepository.layer.pipe(Layer.provide(TestLayer))]))
    );

    it.effect('values fund certificates by the latest market price converted to the base instrument', () =>
        Effect.gen(function* () {
            const exchangeRateRepository = yield* ExchangeRateRepository;
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const { base: fund, quote: hryvnia } = yield* seedPair('TF1', 'TH1', InstrumentTypeEnum.FUND);
            const { base: unpricedFund } = yield* seedPair('TF2', 'TH2', InstrumentTypeEnum.FUND);
            const dollar = yield* testSeedService.instrument({ code: 'TD1', name: 'TD1', symbol: 'TD1' });

            const fundAccount = yield* testSeedService.account({ instrumentId: fund.id, type: AccountTypeEnum.STOCKS });
            const unpricedAccount = yield* testSeedService.account({ instrumentId: unpricedFund.id, type: AccountTypeEnum.STOCKS });
            yield* testDb.insert(InstrumentDailyMarketPriceEntityTable).values([
                { instrumentId: fund.id, quoteInstrumentId: hryvnia.id, priceDate: '2026-11-03', price: 11.5, source: 'test' },
                { instrumentId: fund.id, quoteInstrumentId: hryvnia.id, priceDate: '2026-11-04', price: 11.675, source: 'test' }
            ]);
            yield* exchangeRateRepository.bulkUpsert([
                { baseInstrumentId: dollar.id, quoteInstrumentId: hryvnia.id, rate: 40, source: 'test' }
            ]);
            yield* testDb.insert(AccountBalanceEntityTable).values([
                { accountId: fundAccount.id, amount: convertToMicroUnits(2283) },
                { accountId: unpricedAccount.id, amount: convertToMicroUnits(87) }
            ]);

            const hryvniaRows = yield* accountBalanceRepository.getHomeAccountRows(hryvnia.id);
            const dollarRows = yield* accountBalanceRepository.getHomeAccountRows(dollar.id);
            const findRow = (rows: typeof hryvniaRows, accountId: number) => rows.find(row => row.account.id === accountId);

            expect(convertFromMicroUnits(findRow(hryvniaRows, fundAccount.id)?.convertedBalance ?? 0)).toBe(26_654.03);
            expect(convertFromMicroUnits(findRow(dollarRows, fundAccount.id)?.convertedBalance ?? 0)).toBeCloseTo((2283 * 11.675) / 40, 2);
            expect(findRow(hryvniaRows, fundAccount.id)?.isValued).toBe(true);
            expect(findRow(hryvniaRows, unpricedAccount.id)?.isValued).toBe(false);
            expect(findRow(hryvniaRows, unpricedAccount.id)?.convertedBalance).toBe(0);

            const [{ netWorth }] = yield* accountBalanceRepository.getNetWorth(hryvnia.id);
            const rowsTotal = hryvniaRows.reduce((total, row) => total + row.convertedBalance, 0);

            expect(netWorth).toBe(rowsTotal);
        }).pipe(Effect.provide(Layer.mergeAll(TestLayer, AccountBalanceRepository.layer.pipe(Layer.provide(TestLayer)))))
    );
});
