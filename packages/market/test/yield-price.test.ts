import { InstrumentTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { formatUtcDay } from '../src/@generic/utils/format-utc-day.util';
import { YieldPriceService } from '../src/yield/service/yield-price.service';

import { BASE_ID, ETH_ID, FUND_ID, UAH_ID, USDT_ID, USD_ID, dailyPrices, fiat, latestRate, makeYieldPriceLayer } from './yield-test-kit';

import type { YieldPricedInstrumentType } from '../src/yield/interface/yield-priced-instrument.type';
import type { YieldWorldInterface } from './yield-test-kit';

const ETH: YieldPricedInstrumentType = { id: ETH_ID, code: 'ETH', type: InstrumentTypeEnum.CRYPTO };
const USDT: YieldPricedInstrumentType = { id: USDT_ID, code: 'USDT', type: InstrumentTypeEnum.CRYPTO };
const FUND: YieldPricedInstrumentType = { id: FUND_ID, code: 'INZ', type: InstrumentTypeEnum.FUND };
const HRYVNIA: YieldPricedInstrumentType = { id: UAH_ID, code: 'UAH', type: InstrumentTypeEnum.FIAT };
const BASE: YieldPricedInstrumentType = { id: BASE_ID, code: 'EUR', type: InstrumentTypeEnum.FIAT };

const STOCK_ID = 950;
const STOCK: YieldPricedInstrumentType = { id: STOCK_ID, code: 'AAPL', type: InstrumentTypeEnum.EQUITY };
const dollarQuotedStock = { ...fiat(STOCK_ID, 'AAPL'), type: InstrumentTypeEnum.EQUITY, quoteInstrumentId: USD_ID };

const hryvniaRate = (rateDate: string, rate: number) => ({ sourceInstrumentId: UAH_ID, targetInstrumentId: BASE_ID, rateDate, rate });

const resolveDays = (world: YieldWorldInterface, instrument: YieldPricedInstrumentType, days: readonly string[]) =>
    Effect.gen(function* () {
        const service = yield* YieldPriceService;
        const series = yield* service.loadSeries(instrument, BASE_ID, '2026-03-01', '2026-06-30');

        return yield* Effect.forEach(days, day => service.resolve(series, day));
    }).pipe(Effect.provide(makeYieldPriceLayer(world)));

const findLatest = (world: YieldWorldInterface, instrument: YieldPricedInstrumentType) =>
    Effect.flatMap(YieldPriceService, service => service.findLatestPrice(instrument, BASE_ID)).pipe(
        Effect.provide(makeYieldPriceLayer(world))
    );

const priced = (price: number, sourceDay: string | null) => ({ price, isEstimated: false, isFarEstimated: false, sourceDay });
const estimated = (price: number | null, isFarEstimated: boolean) => ({ price, isEstimated: true, isFarEstimated, sourceDay: null });

describe('YieldPriceService', () => {
    it.effect('carries a crypto price at most 3 days, and estimates at the valuation day rate beyond it', () =>
        Effect.gen(function* () {
            const world = {
                prices: [...dailyPrices(ETH_ID, BASE_ID, ['2026-03-10'], 2000), ...dailyPrices(ETH_ID, BASE_ID, ['2026-05-20'], 2500)],
                latestRates: [latestRate(ETH_ID, BASE_ID, 2100)]
            };
            const [exact, threeDays, fourDays, farAway, onlyLater] = yield* resolveDays(world, ETH, [
                '2026-03-10',
                '2026-03-13',
                '2026-03-14',
                '2026-04-10',
                '2026-03-05'
            ]);

            expect(exact).toEqual(priced(2000, '2026-03-10'));
            expect(threeDays).toEqual(priced(2000, '2026-03-10'));
            expect(fourDays).toEqual(estimated(2100, false));
            expect(farAway).toEqual(estimated(2100, true));
            expect(onlyLater).toEqual(estimated(2100, false));
        })
    );

    it.effect('keys prices by the UTC day of an instant', () =>
        Effect.gen(function* () {
            const world = { prices: dailyPrices(ETH_ID, BASE_ID, ['2026-03-10'], 2000), latestRates: [latestRate(ETH_ID, BASE_ID, 2100)] };
            const nearMidnight = new Date('2026-03-13T23:30:00.000Z');
            const nextInstant = new Date('2026-03-14T00:30:00.000Z');
            const [sameDay, nextDay] = yield* resolveDays(world, ETH, [formatUtcDay(nearMidnight), formatUtcDay(nextInstant)]);

            expect(formatUtcDay(nearMidnight)).toBe('2026-03-13');
            expect(sameDay).toEqual(priced(2000, '2026-03-10'));
            expect(nextDay).toEqual(estimated(2100, false));
        })
    );

    it.effect('prices a FUND with the nearest NAV within 31 days on either side, converted through UAH', () =>
        Effect.gen(function* () {
            const world = { prices: dailyPrices(FUND_ID, UAH_ID, ['2026-04-01'], 10), historicalRates: [hryvniaRate('2026-01-01', 0.025)] };
            const [before, after, far] = yield* resolveDays(world, FUND, ['2026-03-02', '2026-05-02', '2026-05-03']);

            expect(before).toEqual(priced(0.25, '2026-04-01'));
            expect(after).toEqual(priced(0.25, '2026-04-01'));
            expect(far).toEqual(estimated(null, true));
        })
    );

    it.effect('picks the nearest NAV across a weekend gap', () =>
        Effect.gen(function* () {
            const world = {
                prices: [...dailyPrices(FUND_ID, UAH_ID, ['2026-04-03'], 10), ...dailyPrices(FUND_ID, UAH_ID, ['2026-04-06'], 20)],
                historicalRates: [hryvniaRate('2026-01-01', 0.1)]
            };
            const [saturday, sunday] = yield* resolveDays(world, FUND, ['2026-04-04', '2026-04-05']);

            expect(saturday).toEqual(priced(1, '2026-04-03'));
            expect(sunday).toEqual(priced(2, '2026-04-06'));
        })
    );

    it.effect('tie-breaks to the earlier NAV when both sides are equally near', () =>
        Effect.gen(function* () {
            const world = {
                prices: [...dailyPrices(FUND_ID, UAH_ID, ['2026-04-02'], 10), ...dailyPrices(FUND_ID, UAH_ID, ['2026-04-06'], 20)],
                historicalRates: [hryvniaRate('2026-01-01', 0.1)]
            };
            const [tie] = yield* resolveDays(world, FUND, ['2026-04-04']);

            expect(tie).toEqual(priced(1, '2026-04-02'));
        })
    );

    it.effect('converts a FUND NAV at the valuation day UAH rate, not the NAV day rate', () =>
        Effect.gen(function* () {
            const world = {
                prices: dailyPrices(FUND_ID, UAH_ID, ['2026-04-01'], 10),
                historicalRates: [hryvniaRate('2026-03-01', 0.02), hryvniaRate('2026-04-01', 0.03)]
            };
            const [earlier, later] = yield* resolveDays(world, FUND, ['2026-03-20', '2026-04-10']);

            expect(earlier).toEqual(priced(0.2, '2026-04-01'));
            expect(later).toEqual(priced(0.3, '2026-04-01'));
        })
    );

    it.effect('estimates a FUND instead of pricing it at 0 when the UAH rate is missing', () =>
        Effect.gen(function* () {
            const world = { prices: dailyPrices(FUND_ID, UAH_ID, ['2026-04-01'], 10) };
            const [point] = yield* resolveDays(world, FUND, ['2026-04-01']);

            expect(point).toEqual(estimated(null, false));
        })
    );

    it.effect('uses the earliest UAH rate for a FUND day before the first rate', () =>
        Effect.gen(function* () {
            const world = {
                prices: dailyPrices(FUND_ID, UAH_ID, ['2026-03-10'], 10),
                historicalRates: [hryvniaRate('2026-03-15', 0.02), hryvniaRate('2026-04-01', 0.5)]
            };
            const [point] = yield* resolveDays(world, FUND, ['2026-03-05']);

            expect(point).toEqual(priced(0.2, '2026-03-10'));
        })
    );

    it.effect('never estimates fiat, uses the earliest rate before the first one, and prices the base at 1', () =>
        Effect.gen(function* () {
            const world = { historicalRates: [hryvniaRate('2026-03-05', 0.03), hryvniaRate('2026-03-20', 0.04)] };
            const [beforeFirst, between, after] = yield* resolveDays(world, HRYVNIA, ['2026-03-01', '2026-03-10', '2026-03-25']);
            const [base] = yield* resolveDays(world, BASE, ['2026-06-30']);

            expect(beforeFirst).toEqual(priced(0.03, null));
            expect(between).toEqual(priced(0.03, null));
            expect(after).toEqual(priced(0.04, null));
            expect(base).toEqual(priced(1, null));
        })
    );

    it.effect('prices a stablecoin from stored prices and estimates an unpriced day at the dollar rate of that day', () =>
        Effect.gen(function* () {
            const world = {
                prices: dailyPrices(USDT_ID, BASE_ID, ['2026-03-10'], 0.97),
                historicalRates: [
                    { sourceInstrumentId: USD_ID, targetInstrumentId: BASE_ID, rateDate: '2026-03-05', rate: 0.9 },
                    { sourceInstrumentId: USD_ID, targetInstrumentId: BASE_ID, rateDate: '2026-04-15', rate: 0.8 }
                ]
            };
            const [depeg, carried, nearUnpriced, farUnpriced] = yield* resolveDays(world, USDT, [
                '2026-03-10',
                '2026-03-12',
                '2026-03-20',
                '2026-04-20'
            ]);
            const [noPrices] = yield* resolveDays({ historicalRates: world.historicalRates }, USDT, ['2026-04-20']);

            expect(depeg).toEqual({ price: 0.97, isEstimated: false, isFarEstimated: false, sourceDay: '2026-03-10' });
            expect(carried).toEqual(priced(0.97, '2026-03-10'));
            expect(nearUnpriced).toEqual(estimated(0.9, false));
            expect(farUnpriced).toEqual(estimated(0.8, true));
            expect(noPrices).toEqual(estimated(0.8, true));
        })
    );

    it.effect('estimates a crypto at the fallback rate, far, when it has no stored price', () =>
        Effect.gen(function* () {
            const [point] = yield* resolveDays({ latestRates: [latestRate(ETH_ID, BASE_ID, 2100)] }, ETH, ['2026-06-01']);

            expect(point).toEqual(estimated(2100, true));
        })
    );

    it.effect('returns no price, estimated and far, when nothing is known', () =>
        Effect.gen(function* () {
            const [point] = yield* resolveDays({}, ETH, ['2026-06-01']);

            expect(point).toEqual(estimated(null, true));
        })
    );

    it.effect('reads the latest crypto price from exchange rates, else the last daily price as estimated', () =>
        Effect.gen(function* () {
            const withRate = yield* findLatest({ latestRates: [latestRate(ETH_ID, BASE_ID, 2000)] }, ETH);
            const withPrice = yield* findLatest({ prices: dailyPrices(ETH_ID, BASE_ID, ['2026-03-01', '2026-03-02'], 1900) }, ETH);
            const withNothing = yield* findLatest({}, ETH);

            expect(withRate).toEqual({ price: 2000, isEstimated: false });
            expect(withPrice).toEqual({ price: 1900, isEstimated: true });
            expect(withNothing).toEqual({ price: null, isEstimated: true });
        })
    );

    it.effect('prices a stock quoted in another currency through the valuation day rate of its quote currency', () =>
        Effect.gen(function* () {
            const world = {
                instruments: [dollarQuotedStock],
                prices: dailyPrices(STOCK_ID, USD_ID, ['2026-03-10'], 200),
                historicalRates: [{ sourceInstrumentId: USD_ID, targetInstrumentId: BASE_ID, rateDate: '2026-03-01', rate: 0.9 }],
                latestRates: [latestRate(STOCK_ID, USD_ID, 210), latestRate(USD_ID, BASE_ID, 0.92)]
            };
            const [point] = yield* resolveDays(world, STOCK, ['2026-03-10']);

            expect(point).toEqual(priced(180, '2026-03-10'));
            expect(yield* findLatest(world, STOCK)).toEqual({ price: 210 * 0.92, isEstimated: false });
            expect(yield* findLatest({ ...world, latestRates: [latestRate(USD_ID, BASE_ID, 0.92)] }, STOCK)).toEqual({
                price: 200 * 0.92,
                isEstimated: true
            });
        })
    );

    it.effect('reads the latest fund NAV through UAH and the latest fiat and base prices', () =>
        Effect.gen(function* () {
            const world = {
                prices: dailyPrices(FUND_ID, UAH_ID, ['2026-04-01', '2026-04-02'], 10),
                latestRates: [latestRate(UAH_ID, BASE_ID, 0.025)]
            };

            expect(yield* findLatest(world, FUND)).toEqual({ price: 0.25, isEstimated: false });
            expect(yield* findLatest(world, HRYVNIA)).toEqual({ price: 0.025, isEstimated: false });
            expect(yield* findLatest(world, BASE)).toEqual({ price: 1, isEstimated: false });
        })
    );
});
