import { AccountTypeEnum, InstrumentTypeEnum, PRECISION } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { ExchangeRateRepository } from '../src/exchange-rate/repository/exchange-rate.repository';
import { ExchangeRatesSyncService } from '../src/exchange-rate/service/exchange-rates-sync.service';
import { ExchangeRatesService } from '../src/exchange-rate/service/exchange-rates.service';
import { HistoricalExchangeRateRepository } from '../src/historical-exchange-rate/repository/historical-exchange-rate.repository';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';

import { makeFakeHttpClientLayer, setDefaultInstrument, TestLayer, testSeedService } from './test-context';

const seedPair = Effect.fnUntraced(function* (baseCode: string, quoteCode: string, type = InstrumentTypeEnum.FIAT) {
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
        }).pipe(
            Effect.provide(Layer.mergeAll(TestLayer, makeFakeHttpClientLayer({ base: 'TA6', date: '2026-01-01', rates: { TB6: 2.5 } })))
        )
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
});
