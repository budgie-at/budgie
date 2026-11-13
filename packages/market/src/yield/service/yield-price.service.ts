import { CurrencyEnum, InstrumentRepository, InstrumentTypeEnum } from '@budgie/contracts';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { subDays } from 'date-fns/subDays';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { findLastIndexOnOrBefore } from '../../@generic/utils/find-last-index-on-or-before.util';
import { ExchangeRateRepository } from '../../exchange-rate/repository/exchange-rate.repository';
import { HistoricalExchangeRateRepository } from '../../historical-exchange-rate/repository/historical-exchange-rate.repository';
import { InstrumentDailyMarketPriceRepository } from '../../market-data/repository/instrument-daily-market-price.repository';
import { CRYPTO_PRICE_CARRY_DAYS, FUND_PRICE_CARRY_DAYS } from '../../valuation/constant/price-carry-days.constant';
import { STABLECOIN_CODES } from '../../valuation/constant/stablecoin-codes.constant';

import type { YieldLatestPriceInterface } from '../interface/yield-latest-price.interface';
import type { YieldPricePointInterface } from '../interface/yield-price-point.interface';
import type { YieldPriceSampleInterface } from '../interface/yield-price-sample.interface';
import type { YieldPriceSeriesInterface } from '../interface/yield-price-series.interface';
import type { YieldPricedInstrumentInterface } from '../interface/yield-priced-instrument.interface';

export class YieldPriceService extends Context.Service<YieldPriceService>()('@budgie/market/YieldPriceService', {
    make: Effect.gen(function* () {
        const dailyPriceRepository = yield* InstrumentDailyMarketPriceRepository;
        const historicalExchangeRateRepository = yield* HistoricalExchangeRateRepository;
        const exchangeRateRepository = yield* ExchangeRateRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const DAY_FORMAT = 'yyyy-MM-dd';
        const FAR_ESTIMATE_DAYS = 30;
        const CONSTANT_SERIES: YieldPriceSeriesInterface = {
            days: [],
            prices: [],
            carryDays: 0,
            isNearest: false,
            isEstimable: false,
            isFiatPegged: false,
            fallbackPrice: 1
        };
        const BASE_PRICE: YieldLatestPriceInterface = { price: 1, isEstimated: false };

        const gapInDays = (laterDay: string, earlierDay: string) => differenceInCalendarDays(parseISO(laterDay), parseISO(earlierDay));

        const buildSeries = (
            samples: readonly YieldPriceSampleInterface[],
            rule: Omit<YieldPriceSeriesInterface, 'days' | 'prices'>
        ): YieldPriceSeriesInterface => ({
            ...rule,
            days: samples.map(sample => sample.day),
            prices: samples.map(sample => sample.price)
        });

        const loadSamples = <Row, E, R>(
            fromDay: string,
            toDay: string,
            lookups: {
                readonly findEarlier: (fromDay: string) => Effect.Effect<Row | undefined, E, R>;
                readonly findInRange: (fromDay: string, toDay: string) => Effect.Effect<readonly Row[], E, R>;
            },
            toSample: (row: Row) => YieldPriceSampleInterface
        ) =>
            Effect.map(Effect.all([lookups.findEarlier(fromDay), lookups.findInRange(fromDay, toDay)]), ([earlier, inRange]) => {
                const samples = inRange.map(toSample);
                const earlierSample = isDefined(earlier) ? toSample(earlier) : null;

                return isDefined(earlierSample) && earlierSample.day < fromDay ? [earlierSample, ...samples] : samples;
            });

        const loadMarketSamples = (instrumentId: number, quoteInstrumentId: number, fromDay: string, toDay: string) =>
            loadSamples(
                fromDay,
                toDay,
                {
                    findEarlier: day => dailyPriceRepository.findForDateOrBefore(instrumentId, quoteInstrumentId, day),
                    findInRange: (from, to) => dailyPriceRepository.findInDateRange(instrumentId, quoteInstrumentId, from, to)
                },
                row => ({ day: row.priceDate, price: row.price })
            );

        const loadRateSamples = (sourceInstrumentId: number, targetInstrumentId: number, fromDay: string, toDay: string) =>
            loadSamples(
                fromDay,
                toDay,
                {
                    findEarlier: day => historicalExchangeRateRepository.findForDateOrBefore(sourceInstrumentId, targetInstrumentId, day),
                    findInRange: (from, to) =>
                        historicalExchangeRateRepository.findInDateRange(sourceInstrumentId, targetInstrumentId, from, to)
                },
                row => ({ day: row.rateDate, price: row.rate })
            );

        const findLatestRate = Effect.fnUntraced(function* (instrumentId: number, baseInstrumentId: number) {
            if (instrumentId === baseInstrumentId) {
                return 1;
            }

            const direct = yield* exchangeRateRepository.findByBaseAndQuoteIds(instrumentId, baseInstrumentId);

            if (isDefined(direct)) {
                return direct.rate;
            }

            const inverse = yield* exchangeRateRepository.findByBaseAndQuoteIds(baseInstrumentId, instrumentId);

            return isDefined(inverse) && isPositiveNumber(inverse.rate) ? 1 / inverse.rate : null;
        });

        const resolve = (series: YieldPriceSeriesInterface, day: string): YieldPricePointInterface => {
            const beforeIndex = findLastIndexOnOrBefore(series.days, day);
            const beforeDay = series.days[beforeIndex];
            const afterDay = series.days.at(beforeIndex + 1);
            const beforeGap = isDefined(beforeDay) ? gapInDays(day, beforeDay) : Number.POSITIVE_INFINITY;
            const afterGap = isDefined(afterDay) ? gapInDays(afterDay, day) : Number.POSITIVE_INFINITY;
            const nearestGap = Math.min(beforeGap, afterGap);

            if (!Number.isFinite(nearestGap)) {
                return {
                    price: series.fallbackPrice,
                    isEstimated: series.isEstimable,
                    isFarEstimated: series.isEstimable && !series.isFiatPegged,
                    sourceDay: null
                };
            }

            const pricedGap = series.isNearest ? nearestGap : beforeGap;
            const isPriced = pricedGap <= series.carryDays;

            if (!isPriced && series.isFiatPegged) {
                return { price: series.fallbackPrice, isEstimated: true, isFarEstimated: false, sourceDay: null };
            }

            const index = (isPriced && !series.isNearest) || beforeGap <= afterGap ? beforeIndex : beforeIndex + 1;
            const isEstimated = series.isEstimable && !isPriced;

            return {
                price: series.prices.at(index) ?? null,
                isEstimated,
                isFarEstimated: isEstimated && nearestGap > FAR_ESTIMATE_DAYS,
                sourceDay: series.days.at(index) ?? null
            };
        };

        const loadFiatSeries = Effect.fnUntraced(function* (
            instrumentId: number,
            baseInstrumentId: number,
            fromDay: string,
            toDay: string
        ) {
            if (instrumentId === baseInstrumentId) {
                return CONSTANT_SERIES;
            }

            const samples = yield* loadRateSamples(instrumentId, baseInstrumentId, fromDay, toDay);
            const fallbackPrice = yield* findLatestRate(instrumentId, baseInstrumentId);

            return buildSeries(samples, {
                carryDays: Number.POSITIVE_INFINITY,
                isNearest: false,
                isEstimable: false,
                isFiatPegged: false,
                fallbackPrice
            });
        });

        const loadFundSeries = Effect.fnUntraced(function* (
            fundInstrumentId: number,
            baseInstrumentId: number,
            fromDay: string,
            toDay: string
        ) {
            const hryvnia = yield* instrumentRepository.findByCode(CurrencyEnum.UAH);
            const rule = { carryDays: FUND_PRICE_CARRY_DAYS, isNearest: true, isEstimable: true, isFiatPegged: false, fallbackPrice: null };

            if (!isDefined(hryvnia)) {
                return buildSeries([], rule);
            }

            const hryvniaSeries = yield* loadFiatSeries(hryvnia.id, baseInstrumentId, fromDay, toDay);
            const navSamples = yield* loadMarketSamples(fundInstrumentId, hryvnia.id, fromDay, toDay);

            return buildSeries(
                navSamples.map(sample => ({ day: sample.day, price: sample.price * (resolve(hryvniaSeries, sample.day).price ?? 0) })),
                rule
            );
        });

        const findStablecoinFallbackPrice = Effect.fnUntraced(function* (baseInstrumentId: number) {
            const dollar = yield* instrumentRepository.findByCode(CurrencyEnum.USD);

            return isDefined(dollar) ? yield* findLatestRate(dollar.id, baseInstrumentId) : null;
        });

        const loadMarketSeries = Effect.fnUntraced(function* (
            instrument: YieldPricedInstrumentInterface,
            baseInstrumentId: number,
            fromDay: string,
            toDay: string
        ) {
            const isStablecoin = STABLECOIN_CODES.has(instrument.code);

            const samples = yield* loadMarketSamples(instrument.id, baseInstrumentId, fromDay, toDay);
            const fallbackPrice = isStablecoin
                ? yield* findStablecoinFallbackPrice(baseInstrumentId)
                : yield* findLatestRate(instrument.id, baseInstrumentId);

            return buildSeries(samples, {
                carryDays: CRYPTO_PRICE_CARRY_DAYS,
                isNearest: false,
                isEstimable: true,
                isFiatPegged: isStablecoin,
                fallbackPrice
            });
        });

        const findLatestFundPrice = Effect.fnUntraced(function* (fundInstrumentId: number, baseInstrumentId: number) {
            const hryvnia = yield* instrumentRepository.findByCode(CurrencyEnum.UAH);
            const nav = isDefined(hryvnia) ? yield* dailyPriceRepository.findLatest(fundInstrumentId, hryvnia.id) : null;
            const rate = isDefined(hryvnia) ? yield* findLatestRate(hryvnia.id, baseInstrumentId) : null;
            const latest: YieldLatestPriceInterface = {
                price: isDefined(nav) && isDefined(rate) ? nav.price * rate : null,
                isEstimated: false
            };

            return latest;
        });

        const findLatestMarketPrice = Effect.fnUntraced(function* (instrumentId: number, baseInstrumentId: number) {
            const rate = yield* findLatestRate(instrumentId, baseInstrumentId);

            if (isDefined(rate)) {
                const priced: YieldLatestPriceInterface = { price: rate, isEstimated: false };

                return priced;
            }

            const latest = yield* dailyPriceRepository.findLatest(instrumentId, baseInstrumentId);
            const estimated: YieldLatestPriceInterface = { price: latest?.price ?? null, isEstimated: true };

            return estimated;
        });

        return {
            resolve,

            loadSeries: Effect.fn('YieldPriceService.loadSeries')(function* (
                instrument: YieldPricedInstrumentInterface,
                baseInstrumentId: number,
                fromDay: string,
                toDay: string
            ) {
                const seriesFromDay = format(subDays(parseISO(fromDay), FUND_PRICE_CARRY_DAYS), DAY_FORMAT);

                if (instrument.id === baseInstrumentId) {
                    return CONSTANT_SERIES;
                }

                if (instrument.type === InstrumentTypeEnum.FIAT) {
                    return yield* loadFiatSeries(instrument.id, baseInstrumentId, seriesFromDay, toDay);
                }

                if (instrument.type === InstrumentTypeEnum.FUND) {
                    return yield* loadFundSeries(instrument.id, baseInstrumentId, seriesFromDay, toDay);
                }

                return yield* loadMarketSeries(instrument, baseInstrumentId, seriesFromDay, toDay);
            }),

            findLatestPrice: Effect.fn('YieldPriceService.findLatestPrice')(function* (
                instrument: YieldPricedInstrumentInterface,
                baseInstrumentId: number
            ) {
                if (instrument.id === baseInstrumentId) {
                    return BASE_PRICE;
                }

                if (instrument.type === InstrumentTypeEnum.FIAT) {
                    const fiat: YieldLatestPriceInterface = {
                        price: yield* findLatestRate(instrument.id, baseInstrumentId),
                        isEstimated: false
                    };

                    return fiat;
                }

                if (instrument.type === InstrumentTypeEnum.FUND) {
                    return yield* findLatestFundPrice(instrument.id, baseInstrumentId);
                }

                return yield* findLatestMarketPrice(instrument.id, baseInstrumentId);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(YieldPriceService, YieldPriceService.make).pipe(
        Layer.provide([
            InstrumentDailyMarketPriceRepository.layer,
            HistoricalExchangeRateRepository.layer,
            ExchangeRateRepository.layer,
            InstrumentRepository.layer
        ])
    );
}
