import { InstrumentTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { formatUtcDay } from '../src/@generic/utils/format-utc-day.util';
import { YieldPriceService } from '../src/yield/service/yield-price.service';

import { BASE_ID, ETH_ID, FUND_ID, UAH_ID, USDT_ID, USD_ID, dailyPrices, latestRate, makeYieldPriceLayer } from './yield-test-kit';

import type { YieldPricedInstrumentInterface } from '../src/yield/interface/yield-priced-instrument.interface';
import type { YieldWorldInterface } from './yield-test-kit';

const ETH: YieldPricedInstrumentInterface = { id: ETH_ID, code: 'ETH', type: InstrumentTypeEnum.CRYPTO };
const USDT: YieldPricedInstrumentInterface = { id: USDT_ID, code: 'USDT', type: InstrumentTypeEnum.CRYPTO };
const FUND: YieldPricedInstrumentInterface = { id: FUND_ID, code: 'INZ', type: InstrumentTypeEnum.FUND };
const HRYVNIA: YieldPricedInstrumentInterface = { id: UAH_ID, code: 'UAH', type: InstrumentTypeEnum.FIAT };
const BASE: YieldPricedInstrumentInterface = { id: BASE_ID, code: 'EUR', type: InstrumentTypeEnum.FIAT };

const resolveDays = (world: YieldWorldInterface, instrument: YieldPricedInstrumentInterface, days: readonly string[]) =>
    Effect.gen(function* () {
        const service = yield* YieldPriceService;
        const series = yield* service.loadSeries(instrument, BASE_ID, '2026-03-01', '2026-06-30');

        return days.map(day => service.resolve(series, day));
    }).pipe(Effect.provide(makeYieldPriceLayer(world)));

const findLatest = (world: YieldWorldInterface, instrument: YieldPricedInstrumentInterface) =>
    Effect.flatMap(YieldPriceService, service => service.findLatestPrice(instrument, BASE_ID)).pipe(
        Effect.provide(makeYieldPriceLayer(world))
    );

const priced = (price: number, sourceDay: string | null) => ({ price, isEstimated: false, isFarEstimated: false, sourceDay });

describe('YieldPriceService', () => {
    it.effect('carries a crypto price at most 3 days forward and never carries a later price back', () =>
        Effect.gen(function* () {
            const world = {
                prices: [
                    ...dailyPrices(ETH_ID, BASE_ID, ['2026-03-10', '2026-03-10'], 2000),
                    ...dailyPrices(ETH_ID, BASE_ID, ['2026-05-20', '2026-05-20'], 2500)
                ]
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
            expect(fourDays).toEqual({ price: 2000, isEstimated: true, isFarEstimated: false, sourceDay: '2026-03-10' });
            expect(farAway).toEqual({ price: 2000, isEstimated: true, isFarEstimated: true, sourceDay: '2026-03-10' });
            expect(onlyLater).toEqual({ price: 2000, isEstimated: true, isFarEstimated: false, sourceDay: '2026-03-10' });
        })
    );

    it.effect('keys prices by the UTC day of an instant', () =>
        Effect.gen(function* () {
            const world = { prices: dailyPrices(ETH_ID, BASE_ID, ['2026-03-10', '2026-03-10'], 2000) };
            const nearMidnight = new Date('2026-03-13T23:30:00.000Z');
            const [point] = yield* resolveDays(world, ETH, [formatUtcDay(nearMidnight)]);

            expect(formatUtcDay(nearMidnight)).toBe('2026-03-13');
            expect(point).toEqual(priced(2000, '2026-03-10'));
        })
    );

    it.effect('prices a FUND with the nearest NAV within 31 days on either side, converted through UAH', () =>
        Effect.gen(function* () {
            const world = {
                prices: dailyPrices(FUND_ID, UAH_ID, ['2026-04-01', '2026-04-01'], 10),
                historicalRates: [{ sourceInstrumentId: UAH_ID, targetInstrumentId: BASE_ID, rateDate: '2026-01-01', rate: 0.025 }]
            };
            const [before, after, far] = yield* resolveDays(world, FUND, ['2026-03-02', '2026-05-02', '2026-05-03']);

            expect(before).toEqual(priced(0.25, '2026-04-01'));
            expect(after).toEqual(priced(0.25, '2026-04-01'));
            expect(far).toEqual({ price: 0.25, isEstimated: true, isFarEstimated: true, sourceDay: '2026-04-01' });
        })
    );

    it.effect('never estimates fiat and always prices the base at 1', () =>
        Effect.gen(function* () {
            const world = {
                historicalRates: [{ sourceInstrumentId: UAH_ID, targetInstrumentId: BASE_ID, rateDate: '2025-01-01', rate: 0.025 }]
            };
            const [fiat] = yield* resolveDays(world, HRYVNIA, ['2026-06-30']);
            const [base] = yield* resolveDays(world, BASE, ['2026-06-30']);

            expect(fiat).toEqual(priced(0.025, '2025-01-01'));
            expect(base).toEqual(priced(1, null));
        })
    );

    it.effect('prices a stablecoin from stored prices and estimates an unpriced day at the dollar rate', () =>
        Effect.gen(function* () {
            const world = {
                prices: dailyPrices(USDT_ID, BASE_ID, ['2026-03-10', '2026-03-10'], 0.97),
                latestRates: [latestRate(USD_ID, BASE_ID, 0.9)]
            };
            const [depeg, carried, unpriced] = yield* resolveDays(world, USDT, ['2026-03-10', '2026-03-12', '2026-04-20']);
            const [noPrices] = yield* resolveDays({ latestRates: world.latestRates }, USDT, ['2026-04-20']);

            expect(depeg).toEqual(priced(0.97, '2026-03-10'));
            expect(carried).toEqual(priced(0.97, '2026-03-10'));
            expect(unpriced).toEqual({ price: 0.9, isEstimated: true, isFarEstimated: false, sourceDay: null });
            expect(noPrices).toEqual({ price: 0.9, isEstimated: true, isFarEstimated: false, sourceDay: null });
        })
    );

    it.effect('estimates a crypto at the latest rate, far, when it has no stored price', () =>
        Effect.gen(function* () {
            const [point] = yield* resolveDays({ latestRates: [latestRate(ETH_ID, BASE_ID, 2100)] }, ETH, ['2026-06-01']);

            expect(point).toEqual({ price: 2100, isEstimated: true, isFarEstimated: true, sourceDay: null });
        })
    );

    it.effect('returns no price, estimated and far, when nothing is known', () =>
        Effect.gen(function* () {
            const [point] = yield* resolveDays({}, ETH, ['2026-06-01']);

            expect(point).toEqual({ price: null, isEstimated: true, isFarEstimated: true, sourceDay: null });
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

    it.effect('reads the latest fund NAV through UAH and the latest fiat and base prices', () =>
        Effect.gen(function* () {
            const world = {
                prices: dailyPrices(FUND_ID, UAH_ID, ['2026-04-01', '2026-04-02'], 10),
                latestRates: [latestRate(UAH_ID, BASE_ID, 0.025), latestRate(UAH_ID, BASE_ID, 0.025)]
            };

            expect(yield* findLatest(world, FUND)).toEqual({ price: 0.25, isEstimated: false });
            expect(yield* findLatest(world, HRYVNIA)).toEqual({ price: 0.025, isEstimated: false });
            expect(yield* findLatest(world, BASE)).toEqual({ price: 1, isEstimated: false });
        })
    );
});
