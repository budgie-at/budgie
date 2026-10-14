import { InstrumentTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { ExchangeRateRepository } from '../src/exchange-rate/repository/exchange-rate.repository';
import { ExchangeRatesService } from '../src/exchange-rate/service/exchange-rates.service';
import { HistoricalExchangeRateRepository } from '../src/historical-exchange-rate/repository/historical-exchange-rate.repository';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';

import { setDefaultInstrument, TestLayer, testSeedService } from './test-context';

const rate = Schema.Number.check(Schema.isFinite(), Schema.isBetween({ minimum: 0.01, maximum: 100 }));
const amount = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 1_000_000_000_000 }));

let seededPairs = 0;

const seedPair = Effect.fnUntraced(function* () {
    seededPairs += 1;
    const base = yield* testSeedService.instrument({ code: `PB${seededPairs}`, name: 'b', symbol: 'b', type: InstrumentTypeEnum.FIAT });
    const quote = yield* testSeedService.instrument({ code: `PQ${seededPairs}`, name: 'q', symbol: 'q' });

    return { base, quote };
});

describe('exchange rate properties', () => {
    it.effect.prop('converting A to B and back stays within the rounding tolerance', { rate, amount }, ({ rate, amount }) =>
        Effect.gen(function* () {
            const exchangeRatesService = yield* ExchangeRatesService;
            const exchangeRateRepository = yield* ExchangeRateRepository;
            const { base, quote } = yield* seedPair();

            yield* exchangeRateRepository.bulkUpsert([{ baseInstrumentId: base.id, quoteInstrumentId: quote.id, rate, source: 'test' }]);

            const forward = yield* exchangeRatesService.convertStrict(base.id, quote.id, amount);
            const back = yield* exchangeRatesService.convertStrict(quote.id, base.id, forward?.amount ?? 0);

            expect(Math.abs((back?.amount ?? 0) - amount)).toBeLessThanOrEqual(0.5 / rate + 1);
            expect(back?.exchangeRate).toBeCloseTo(1 / rate, 9);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.prop('lenient and strict conversion agree within one micro unit', { rate, amount }, ({ rate, amount }) =>
        Effect.gen(function* () {
            const exchangeRatesService = yield* ExchangeRatesService;
            const exchangeRateRepository = yield* ExchangeRateRepository;
            const { base, quote } = yield* seedPair();

            yield* exchangeRateRepository.bulkUpsert([{ baseInstrumentId: base.id, quoteInstrumentId: quote.id, rate, source: 'test' }]);

            const strict = yield* exchangeRatesService.convertStrict(base.id, quote.id, amount);
            const lenient = yield* exchangeRatesService.convert(base.id, quote.id, amount);

            expect(Math.abs((strict?.amount ?? 0) - lenient.amount)).toBeLessThanOrEqual(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.prop('base valuation equals the amount scaled by the historical rate', { rate, amount }, ({ rate, amount }) =>
        Effect.gen(function* () {
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const historicalExchangeRateRepository = yield* HistoricalExchangeRateRepository;
            const { base, quote } = yield* seedPair();
            const account = yield* testSeedService.account({ instrumentId: quote.id });

            yield* setDefaultInstrument(base.id);
            yield* historicalExchangeRateRepository.bulkUpsert([
                { sourceInstrumentId: quote.id, targetInstrumentId: base.id, rateDate: '2020-01-01', rate }
            ]);

            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: account.id,
                amount,
                operatedAt: new Date('2020-01-02T12:00:00.000Z')
            });

            expect(valuation).toStrictEqual({ baseInstrumentId: base.id, baseExchangeRate: rate, baseAmount: Math.round(amount * rate) });
        }).pipe(Effect.provide(TestLayer))
    );
});
