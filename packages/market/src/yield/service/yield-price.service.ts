import { CurrencyEnum, InstrumentRepository, InstrumentTypeEnum } from '@budgie/contracts';
import { addDays } from 'date-fns/addDays';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { subDays } from 'date-fns/subDays';
import * as Cache from 'effect/Cache';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { findLastIndexOnOrBefore } from '../../@generic/utils/find-last-index-on-or-before.util';
import { ExchangeRateRepository } from '../../exchange-rate/repository/exchange-rate.repository';
import { InstrumentDailyMarketPriceRepository } from '../../market-data/repository/instrument-daily-market-price.repository';
import { CRYPTO_PRICE_CARRY_DAYS, FUND_PRICE_CARRY_DAYS } from '../../valuation/constant/price-carry-days.constant';
import { STABLECOIN_CODES } from '../../valuation/constant/stablecoin-codes.constant';
import { EntryBaseValuationService } from '../../valuation/service/entry-base-valuation.service';

import type { YieldLatestPriceInterface } from '../interface/yield-latest-price.interface';
import type { YieldPriceLookupType } from '../interface/yield-price-lookup.type';
import type { YieldPricePointInterface } from '../interface/yield-price-point.interface';
import type { YieldPriceSampleInterface } from '../interface/yield-price-sample.interface';
import type { YieldPriceSeriesInterface } from '../interface/yield-price-series.interface';
import type { YieldPricedInstrumentType } from '../interface/yield-priced-instrument.type';

export class YieldPriceService extends Context.Service<YieldPriceService>()('@budgie/market/YieldPriceService', {
    make: Effect.gen(function* () {
        const dailyPriceRepository = yield* InstrumentDailyMarketPriceRepository;
        const exchangeRateRepository = yield* ExchangeRateRepository;
        const instrumentRepository = yield* InstrumentRepository;
        const entryBaseValuationService = yield* EntryBaseValuationService;
        const DAY_FORMAT = 'yyyy-MM-dd';
        const FAR_ESTIMATE_DAYS = 30;
        const NO_SAMPLES: readonly YieldPriceSampleInterface[] = [];
        const IDENTITY_RATE: YieldPriceLookupType = () => Effect.succeed(1);
        const MISSING_RATE: YieldPriceLookupType = () => Effect.succeed(null);
        const BASE_PRICE: YieldLatestPriceInterface = { price: 1, isEstimated: false };

        const gapInDays = (laterDay: string, earlierDay: string) => differenceInCalendarDays(parseISO(laterDay), parseISO(earlierDay));

        const rateOnDay =
            (instrumentId: number, baseInstrumentId: number): YieldPriceLookupType =>
            day =>
                instrumentId === baseInstrumentId
                    ? Effect.succeed(1)
                    : entryBaseValuationService.resolveHistoricalBaseExchangeRateForDay(instrumentId, baseInstrumentId, day);

        const memoize = (lookup: YieldPriceLookupType) =>
            Effect.map(Cache.make({ capacity: Number.MAX_SAFE_INTEGER, lookup }), cache => {
                const memoized: YieldPriceLookupType = day => Cache.get(cache, day);

                return memoized;
            });

        const buildSeries = Effect.fnUntraced(function* (
            samples: readonly YieldPriceSampleInterface[],
            rule: Pick<YieldPriceSeriesInterface, 'carryDays' | 'isEstimable' | 'isNearest'>,
            quoteToBase: YieldPriceLookupType,
            fallbackPrice: YieldPriceLookupType
        ) {
            const series: YieldPriceSeriesInterface = {
                ...rule,
                days: samples.map(sample => sample.day),
                prices: samples.map(sample => sample.price),
                quoteToBase: yield* memoize(quoteToBase),
                fallbackPrice: yield* memoize(fallbackPrice)
            };

            return series;
        });

        const loadMarketSamples = Effect.fnUntraced(function* (
            instrumentId: number,
            quoteInstrumentId: number,
            fromDay: string,
            toDay: string
        ) {
            const earlier = yield* dailyPriceRepository.findForDateOrBefore(instrumentId, quoteInstrumentId, fromDay);
            const inRange = yield* dailyPriceRepository.findInDateRange(instrumentId, quoteInstrumentId, fromDay, toDay);
            const samples = inRange.map(row => ({ day: row.priceDate, price: row.price }));

            return isDefined(earlier) && earlier.priceDate < fromDay
                ? [{ day: earlier.priceDate, price: earlier.price }, ...samples]
                : samples;
        });

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

        const findQuoteInstrumentId = (instrumentId: number, baseInstrumentId: number) =>
            Effect.map(instrumentRepository.findById(instrumentId), instrument => instrument?.quoteInstrumentId ?? baseInstrumentId);

        const resolve = Effect.fn('YieldPriceService.resolve')(function* (series: YieldPriceSeriesInterface, day: string) {
            const beforeIndex = findLastIndexOnOrBefore(series.days, day);
            const beforeDay = series.days[beforeIndex];
            const afterDay = series.days[beforeIndex + 1];
            const beforeGap = isDefined(beforeDay) ? gapInDays(day, beforeDay) : Number.POSITIVE_INFINITY;
            const afterGap = isDefined(afterDay) ? gapInDays(afterDay, day) : Number.POSITIVE_INFINITY;
            const nearestGap = Math.min(beforeGap, afterGap);
            const pricedGap = series.isNearest ? nearestGap : beforeGap;
            const index = series.isNearest && afterGap < beforeGap ? beforeIndex + 1 : beforeIndex;
            const quoteRate = pricedGap <= series.carryDays ? yield* series.quoteToBase(day) : null;
            const samplePrice = series.prices[index];

            if (isDefined(samplePrice) && isDefined(quoteRate)) {
                const priced: YieldPricePointInterface = {
                    price: samplePrice * quoteRate,
                    isEstimated: false,
                    isFarEstimated: false,
                    sourceDay: series.days[index] ?? null
                };

                return priced;
            }

            const fallback: YieldPricePointInterface = {
                price: yield* series.fallbackPrice(day),
                isEstimated: series.isEstimable,
                isFarEstimated: series.isEstimable && nearestGap > FAR_ESTIMATE_DAYS,
                sourceDay: null
            };

            return fallback;
        });

        const loadFundSeries = Effect.fnUntraced(function* (
            fundInstrumentId: number,
            baseInstrumentId: number,
            fromDay: string,
            toDay: string
        ) {
            const hryvnia = yield* instrumentRepository.findByCode(CurrencyEnum.UAH);
            const rule = { carryDays: FUND_PRICE_CARRY_DAYS, isNearest: true, isEstimable: true };

            if (!isDefined(hryvnia)) {
                return yield* buildSeries(NO_SAMPLES, rule, MISSING_RATE, rateOnDay(fundInstrumentId, baseInstrumentId));
            }

            const navToDay = format(addDays(parseISO(toDay), FUND_PRICE_CARRY_DAYS), DAY_FORMAT);
            const navSamples = yield* loadMarketSamples(fundInstrumentId, hryvnia.id, fromDay, navToDay);

            return yield* buildSeries(
                navSamples,
                rule,
                rateOnDay(hryvnia.id, baseInstrumentId),
                rateOnDay(fundInstrumentId, baseInstrumentId)
            );
        });

        const loadMarketSeries = Effect.fnUntraced(function* (
            instrument: YieldPricedInstrumentType,
            baseInstrumentId: number,
            fromDay: string,
            toDay: string
        ) {
            const quoteInstrumentId = yield* findQuoteInstrumentId(instrument.id, baseInstrumentId);
            const samples = yield* loadMarketSamples(instrument.id, quoteInstrumentId, fromDay, toDay);
            const dollar = STABLECOIN_CODES.has(instrument.code) ? yield* instrumentRepository.findByCode(CurrencyEnum.USD) : null;
            const stablecoinRate = isDefined(dollar) ? rateOnDay(dollar.id, baseInstrumentId) : MISSING_RATE;
            const fallbackPrice = STABLECOIN_CODES.has(instrument.code) ? stablecoinRate : rateOnDay(instrument.id, baseInstrumentId);

            return yield* buildSeries(
                samples,
                { carryDays: CRYPTO_PRICE_CARRY_DAYS, isNearest: false, isEstimable: true },
                rateOnDay(quoteInstrumentId, baseInstrumentId),
                fallbackPrice
            );
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
            const quoteInstrumentId = yield* findQuoteInstrumentId(instrumentId, baseInstrumentId);
            const quoteRate = yield* findLatestRate(quoteInstrumentId, baseInstrumentId);
            const rate = yield* findLatestRate(instrumentId, quoteInstrumentId);

            if (isDefined(rate) && isDefined(quoteRate)) {
                const priced: YieldLatestPriceInterface = { price: rate * quoteRate, isEstimated: false };

                return priced;
            }

            const latest = yield* dailyPriceRepository.findLatest(instrumentId, quoteInstrumentId);
            const estimated: YieldLatestPriceInterface = {
                price: isDefined(latest) && isDefined(quoteRate) ? latest.price * quoteRate : null,
                isEstimated: true
            };

            return estimated;
        });

        return {
            resolve,

            loadSeries: Effect.fn('YieldPriceService.loadSeries')(function* (
                instrument: YieldPricedInstrumentType,
                baseInstrumentId: number,
                fromDay: string,
                toDay: string
            ) {
                const seriesFromDay = format(subDays(parseISO(fromDay), FUND_PRICE_CARRY_DAYS), DAY_FORMAT);
                const fiatRule = { carryDays: 0, isNearest: false, isEstimable: false };

                if (instrument.id === baseInstrumentId || instrument.type === InstrumentTypeEnum.FIAT) {
                    return yield* buildSeries(NO_SAMPLES, fiatRule, IDENTITY_RATE, rateOnDay(instrument.id, baseInstrumentId));
                }

                if (instrument.type === InstrumentTypeEnum.FUND) {
                    return yield* loadFundSeries(instrument.id, baseInstrumentId, seriesFromDay, toDay);
                }

                return yield* loadMarketSeries(instrument, baseInstrumentId, seriesFromDay, toDay);
            }),

            findLatestPrice: Effect.fn('YieldPriceService.findLatestPrice')(function* (
                instrument: YieldPricedInstrumentType,
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
            ExchangeRateRepository.layer,
            InstrumentRepository.layer,
            EntryBaseValuationService.layer
        ])
    );
}
