import {
    AccountBalanceRepository,
    AccountTypeEnum,
    CurrencyEnum,
    ExchangeRateEntityTable,
    InstrumentDailyMarketPriceEntityTable,
    PRECISION,
    SettingsEntityTable
} from '@budgie/contracts';
import { ExchangeRatesService } from '@budgie/market';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { requireInstrument, seedBitcoinCryptoAccount, seedLedgerBalance, TestLayer } from '../../harness';
import { insertOne } from '../../harness/db/insert-one';
import { testDb } from '../../harness/scenario/test-db';
import { seed } from '../../harness/seed/seed';

const BITCOIN_EURO_RATE = 50_000;
const CRYPTO_BALANCE_UNITS = 100;
const LIVE_CRYPTO_TOTAL = BITCOIN_EURO_RATE * CRYPTO_BALANCE_UNITS * PRECISION;

const seedHryvniaCashWithBalance = Effect.fnUntraced(function* (balance: number) {
    const euro = yield* requireInstrument(CurrencyEnum.EUR);
    const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);
    const account = yield* seed.account({ instrumentId: hryvnia.id, type: AccountTypeEnum.CASH });

    yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: euro.id });
    yield* seedLedgerBalance(account.id, balance);

    return euro;
});

const seedBitcoinCryptoWithLiveRate = Effect.fnUntraced(function* (balance: number) {
    const result = yield* seedBitcoinCryptoAccount(balance);

    yield* insertOne(ExchangeRateEntityTable, {
        source: 'test',
        baseInstrumentId: result.bitcoin.id,
        quoteInstrumentId: result.euro.id,
        rate: BITCOIN_EURO_RATE
    });

    return result;
});

const expectCryptoTotals = Effect.fnUntraced(function* (defaultInstrumentId: number, expectedTotal: number) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const cryptoTotal = (yield* accountBalanceRepository.getTotalByAccountType(defaultInstrumentId, AccountTypeEnum.CRYPTO)).at(0);
    const assetClassTotals = (yield* accountBalanceRepository.getAssetClassTotals(defaultInstrumentId)).at(0);

    expect(cryptoTotal?.total).toBe(expectedTotal);
    expect(assetClassTotals?.cryptoTotal).toBe(expectedTotal);
});

describe('net worth currency conversion', () => {
    it.effect('converts a foreign balance using the live rate when present', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const euro = yield* seedHryvniaCashWithBalance(1000 * PRECISION);
            const hryvnia = yield* requireInstrument(CurrencyEnum.UAH);

            yield* insertOne(ExchangeRateEntityTable, {
                source: 'test',
                baseInstrumentId: hryvnia.id,
                quoteInstrumentId: euro.id,
                rate: 0.02
            });

            const netWorth = (yield* accountBalanceRepository.getNetWorth(euro.id)).at(0);

            expect(netWorth?.netWorth).toBe(20 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('falls back to the historical rate instead of 1:1 when no live rate exists', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const euro = yield* seedHryvniaCashWithBalance(1000 * PRECISION);

            const netWorth = (yield* accountBalanceRepository.getNetWorth(euro.id)).at(0);
            const cashTotal = (yield* accountBalanceRepository.getTotalByAccountType(euro.id, AccountTypeEnum.CASH)).at(0);

            expect(netWorth?.netWorth).toBeLessThan(50 * PRECISION);
            expect(netWorth?.netWorth).toBeGreaterThan(5 * PRECISION);
            expect(cashTotal?.total).toBe(netWorth?.netWorth);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not value crypto totals or display amounts with fiat fallback when the live rate is missing', () =>
        Effect.gen(function* () {
            const exchangeRatesService = yield* ExchangeRatesService;
            const { bitcoin, euro } = yield* seedBitcoinCryptoAccount(100 * PRECISION);

            const conversion = yield* exchangeRatesService.convertStrict(bitcoin.id, euro.id, 100 * PRECISION);

            yield* expectCryptoTotals(euro.id, 0);
            expect(conversion).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('converts crypto display amounts with the live rate when present', () =>
        Effect.gen(function* () {
            const exchangeRatesService = yield* ExchangeRatesService;
            const { bitcoin, euro } = yield* seedBitcoinCryptoWithLiveRate(100 * PRECISION);

            const conversion = yield* exchangeRatesService.convertStrict(bitcoin.id, euro.id, 100 * PRECISION);

            yield* expectCryptoTotals(euro.id, LIVE_CRYPTO_TOTAL);
            expect(conversion?.amount).toBe(LIVE_CRYPTO_TOTAL);
            expect(conversion?.exchangeRate).toBe(BITCOIN_EURO_RATE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('values a crypto account held in the default currency 1:1 without a stored rate', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const account = yield* seed.account({ instrumentId: euro.id, type: AccountTypeEnum.CRYPTO });
            yield* seedLedgerBalance(account.id, 5 * PRECISION);

            const [row] = yield* accountBalanceRepository.getHomeAccountRows(euro.id);

            yield* expectCryptoTotals(euro.id, 5 * PRECISION);
            expect([row.convertedBalance, row.isValued]).toStrictEqual([5 * PRECISION, true]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('picks the lowest quote instrument when one day has two quotes', () =>
        Effect.gen(function* () {
            const { bitcoin, euro } = yield* seedBitcoinCryptoAccount(PRECISION);
            const lowQuote = yield* seed.instrument({ code: 'XQL', name: 'Low quote' });
            const highQuote = yield* seed.instrument({ code: 'XQH', name: 'High quote' });
            const dailyPrice = { instrumentId: bitcoin.id, priceDate: '2026-06-01', source: 'test' };

            yield* testDb.insert(ExchangeRateEntityTable).values([
                { source: 'test', baseInstrumentId: lowQuote.id, quoteInstrumentId: euro.id, rate: 2 },
                { source: 'test', baseInstrumentId: highQuote.id, quoteInstrumentId: euro.id, rate: 3 }
            ]);
            yield* testDb.insert(InstrumentDailyMarketPriceEntityTable).values([
                { ...dailyPrice, quoteInstrumentId: highQuote.id, price: 100 },
                { ...dailyPrice, quoteInstrumentId: lowQuote.id, price: 100 }
            ]);

            yield* expectCryptoTotals(euro.id, 200 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );
});
