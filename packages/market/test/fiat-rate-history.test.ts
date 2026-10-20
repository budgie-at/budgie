import { CurrencyEnum, HistoricalExchangeRateEntityTable, InstrumentRepository, PRECISION } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { ExchangeRatesSyncService } from '../src/exchange-rate/service/exchange-rates-sync.service';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';

import { makeFakeHttpClientLayer, setDefaultInstrument, TestLayer, testDb, testSeedService } from './test-context';

const postSeedRateDate = '2026-09-01';

const syncFiatRatesFor = (euroRate: number, hryvniaRate: number) =>
    Effect.flatMap(ExchangeRatesSyncService, exchangeRatesSyncService => exchangeRatesSyncService.sync()).pipe(
        Effect.provide(
            Layer.fresh(ExchangeRatesSyncService.layer).pipe(
                Layer.provideMerge(
                    Layer.mergeAll(
                        TestLayer,
                        makeFakeHttpClientLayer({
                            base: CurrencyEnum.USD,
                            date: postSeedRateDate,
                            rates: { USD: 1, EUR: euroRate, UAH: hryvniaRate }
                        })
                    )
                )
            )
        )
    );

const findInstrumentByCode = Effect.fnUntraced(function* (code: CurrencyEnum) {
    const instrumentRepository = yield* InstrumentRepository;

    return yield* Effect.fromNullishOr(yield* instrumentRepository.findByCode(code));
});

describe('fiat rate history', () => {
    it.live('records the daily fiat rates so a post-seed entry is valued at its own date rate', () =>
        Effect.gen(function* () {
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const dollar = yield* findInstrumentByCode(CurrencyEnum.USD);
            const hryvnia = yield* findInstrumentByCode(CurrencyEnum.UAH);
            const account = yield* testSeedService.account({ instrumentId: hryvnia.id });

            yield* setDefaultInstrument(dollar.id);
            yield* syncFiatRatesFor(0.8, 40);

            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: account.id,
                amount: 400 * PRECISION,
                operatedAt: new Date(`${postSeedRateDate}T12:00:00.000Z`)
            });

            expect(valuation.baseInstrumentId).toBe(dollar.id);
            expect(valuation.baseExchangeRate).toBeCloseTo(1 / 40, 12);
            expect(valuation.baseAmount).toBe(10 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.live('keeps one row per pair when the same date is synced again', () =>
        Effect.gen(function* () {
            const euro = yield* findInstrumentByCode(CurrencyEnum.EUR);
            const hryvnia = yield* findInstrumentByCode(CurrencyEnum.UAH);

            yield* syncFiatRatesFor(0.8, 40);
            yield* syncFiatRatesFor(0.9, 45);

            const rows = yield* testDb
                .select()
                .from(HistoricalExchangeRateEntityTable)
                .where(eq(HistoricalExchangeRateEntityTable.rateDate, postSeedRateDate));
            const hryvniaRows = rows.filter(row => row.sourceInstrumentId === hryvnia.id && row.targetInstrumentId === euro.id);

            expect(hryvniaRows).toHaveLength(1);
            expect(hryvniaRows[0]?.rate).toBeCloseTo(0.9 / 45, 12);
            expect(new Set(rows.map(row => row.sourceInstrumentId)).size).toBe(rows.length);
        }).pipe(Effect.provide(TestLayer))
    );
});
