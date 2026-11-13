import { makeTestPlatformLayer } from '@budgie-at/test-kit';
import { InstrumentRepository, InstrumentTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { ExchangeRateRepository } from '../src/exchange-rate/repository/exchange-rate.repository';
import { InstrumentDailyMarketPriceRepository } from '../src/market-data/repository/instrument-daily-market-price.repository';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';
import { YieldPriceService } from '../src/yield/service/yield-price.service';

import { testDb } from './test-context';

import type {
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityInterface,
    InstrumentDailyMarketPriceEntityInterface,
    InstrumentEntityInterface
} from '@budgie/contracts';

type ExchangeRateEntityInterface = typeof ExchangeRateEntityTable.$inferSelect;

export const BASE_ID = 1;
export const USD_ID = 2;
export const UAH_ID = 33;
export const ETH_ID = 35;
export const USDT_ID = 36;
export const FUND_ID = 900;
const NOW = new Date('2026-11-13T12:00:00.000Z');

export interface YieldWorldInterface {
    readonly prices?: readonly InstrumentDailyMarketPriceEntityInterface[];
    readonly historicalRates?: readonly Pick<
        HistoricalExchangeRateEntityInterface,
        'rate' | 'rateDate' | 'sourceInstrumentId' | 'targetInstrumentId'
    >[];
    readonly latestRates?: readonly ExchangeRateEntityInterface[];
}

export const dailyPrices = (
    instrumentId: number,
    quoteInstrumentId: number,
    days: readonly string[],
    price: number
): InstrumentDailyMarketPriceEntityInterface[] =>
    days.map((priceDate, index) => ({
        id: index + 1,
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null,
        instrumentId,
        quoteInstrumentId,
        priceDate,
        price,
        marketCap: null,
        volume: null,
        source: 'test'
    }));

export const latestRate = (baseInstrumentId: number, quoteInstrumentId: number, rate: number): ExchangeRateEntityInterface => ({
    id: baseInstrumentId * 1000 + quoteInstrumentId,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    source: 'test',
    baseInstrumentId,
    quoteInstrumentId,
    rate
});

const fiat = (id: number, code: string): InstrumentEntityInterface => ({
    id,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    type: InstrumentTypeEnum.FIAT,
    code,
    name: code,
    symbol: code,
    priceProvider: null,
    providerInstrumentId: null,
    marketCapRank: null
});

const FIAT_INSTRUMENTS = [fiat(UAH_ID, 'UAH'), fiat(USD_ID, 'USD')];

export const makeYieldPriceLayer = (world: YieldWorldInterface) =>
    Layer.effect(YieldPriceService, YieldPriceService.make).pipe(
        Layer.provide([
            Layer.mock(InstrumentDailyMarketPriceRepository)({
                findInDateRange: (instrumentId, quoteInstrumentId, fromDate, toDate) =>
                    Effect.succeed(
                        (world.prices ?? []).filter(
                            price =>
                                price.instrumentId === instrumentId &&
                                price.quoteInstrumentId === quoteInstrumentId &&
                                price.priceDate >= fromDate &&
                                price.priceDate <= toDate
                        )
                    ),
                findForDateOrBefore: (instrumentId, quoteInstrumentId, priceDate) =>
                    Effect.succeed(
                        (world.prices ?? [])
                            .filter(
                                price =>
                                    price.instrumentId === instrumentId &&
                                    price.quoteInstrumentId === quoteInstrumentId &&
                                    price.priceDate <= priceDate
                            )
                            .at(-1)
                    ),
                findLatest: (instrumentId, quoteInstrumentId) =>
                    Effect.succeed(
                        (world.prices ?? [])
                            .filter(price => price.instrumentId === instrumentId && price.quoteInstrumentId === quoteInstrumentId)
                            .at(-1)
                    )
            }),
            Layer.mock(EntryBaseValuationService)({
                resolveHistoricalBaseExchangeRateForDay: (sourceInstrumentId, targetInstrumentId, rateDate) => {
                    const pairRates = (world.historicalRates ?? []).filter(
                        rate => rate.sourceInstrumentId === sourceInstrumentId && rate.targetInstrumentId === targetInstrumentId
                    );
                    const onOrBefore = pairRates.filter(rate => rate.rateDate <= rateDate).at(-1);
                    const latest = (world.latestRates ?? []).find(
                        rate => rate.baseInstrumentId === sourceInstrumentId && rate.quoteInstrumentId === targetInstrumentId
                    );

                    return Effect.succeed(onOrBefore?.rate ?? pairRates.at(0)?.rate ?? latest?.rate ?? null);
                }
            }),
            Layer.mock(ExchangeRateRepository)({
                findByBaseAndQuoteIds: (baseInstrumentId, quoteInstrumentId) =>
                    Effect.succeed(
                        (world.latestRates ?? []).find(
                            rate => rate.baseInstrumentId === baseInstrumentId && rate.quoteInstrumentId === quoteInstrumentId
                        )
                    )
            }),
            Layer.mock(InstrumentRepository)({
                findByCode: code => Effect.succeed(FIAT_INSTRUMENTS.find(instrument => instrument.code === code))
            })
        ]),
        Layer.provideMerge(makeTestPlatformLayer(testDb))
    );
