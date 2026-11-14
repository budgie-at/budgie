import { makeTestPlatformLayer } from '@budgie-at/test-kit';
import {
    AccountTypeEnum,
    InstrumentRepository,
    InstrumentTypeEnum,
    PRECISION,
    TransactionTypeEnum,
    YieldKindEnum,
    YieldRepository
} from '@budgie/contracts';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import { parseISO } from 'date-fns/parseISO';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as TestClock from 'effect/testing/TestClock';

import { isDefined } from '@rnw-community/shared';

import { formatUtcDay } from '../src/@generic/utils/format-utc-day.util';
import { ExchangeRateRepository } from '../src/exchange-rate/repository/exchange-rate.repository';
import { InstrumentDailyMarketPriceRepository } from '../src/market-data/repository/instrument-daily-market-price.repository';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';
import { YieldRangeEnum } from '../src/yield/enum/yield-range.enum';
import { YieldHoldingService } from '../src/yield/service/yield-holding.service';
import { YieldPriceService } from '../src/yield/service/yield-price.service';
import { YieldService } from '../src/yield/service/yield.service';

import { testDb } from './test-context';

import type { YieldQueryKeyInterface } from '../src/yield/interface/yield-query-key.interface';
import type {
    ExchangeRateEntityTable,
    HistoricalExchangeRateEntityInterface,
    InstrumentDailyMarketPriceEntityInterface,
    InstrumentEntityInterface,
    YieldFactRowInterface,
    YieldPositionMovementRowInterface,
    YieldPositionRowInterface
} from '@budgie/contracts';

type ExchangeRateEntityInterface = typeof ExchangeRateEntityTable.$inferSelect;

export const BASE_ID = 1;
export const USD_ID = 2;
export const UAH_ID = 33;
export const ETH_ID = 35;
export const USDT_ID = 36;
export const SOL_ID = 40;
export const FUND_ID = 900;
export const ETH_ACCOUNT_ID = 10;
export const SOL_ACCOUNT_ID = 11;
export const FUND_ACCOUNT_ID = 20;
export const DEPOSIT_ACCOUNT_ID = 30;
const NOW = new Date('2026-11-13T12:00:00.000Z');
const TODAY = new Date(2026, 10, 13, 12, 0, 0);
const MS_PER_DAY = 86_400_000;
const ETH_REWARD_DAYS = ['2026-02-01', '2026-05-01', '2026-08-01', '2026-11-01'];
let nextTransactionId = 1;

export interface YieldWorldInterface {
    readonly facts?: readonly YieldFactRowInterface[];
    readonly positions?: readonly YieldPositionRowInterface[];
    readonly movements?: readonly YieldPositionMovementRowInterface[];
    readonly prices?: readonly InstrumentDailyMarketPriceEntityInterface[];
    readonly historicalRates?: readonly Pick<
        HistoricalExchangeRateEntityInterface,
        'rate' | 'rateDate' | 'sourceInstrumentId' | 'targetInstrumentId'
    >[];
    readonly latestRates?: readonly ExchangeRateEntityInterface[];
    readonly instruments?: readonly InstrumentEntityInterface[];
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

export const fiat = (id: number, code: string): InstrumentEntityInterface => ({
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
    quoteInstrumentId: null,
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
                findByCode: code => Effect.succeed(FIAT_INSTRUMENTS.find(instrument => instrument.code === code)),
                findById: id => Effect.succeed((world.instruments ?? []).find(instrument => instrument.id === id))
            })
        ]),
        Layer.provideMerge(makeTestPlatformLayer(testDb))
    );

export const priceRange = (
    instrumentId: number,
    quoteInstrumentId: number,
    range: readonly [string, string],
    price: number,
    stepDays = 1
): InstrumentDailyMarketPriceEntityInterface[] =>
    dailyPrices(
        instrumentId,
        quoteInstrumentId,
        Array.from({ length: Math.floor(differenceInCalendarDays(parseISO(range[1]), parseISO(range[0])) / stepDays) + 1 }, (_, index) =>
            formatUtcDay(new Date(Date.parse(`${range[0]}T00:00:00.000Z`) + index * stepDays * MS_PER_DAY))
        ),
        price
    );

export const at = (day: string) => new Date(`${day}T12:00:00`);

const fact = (day: string, overrides: Partial<YieldFactRowInterface> = {}): YieldFactRowInterface => {
    nextTransactionId += 1;

    return {
        transactionId: nextTransactionId,
        transactionType: TransactionTypeEnum.INCOME,
        yieldKind: YieldKindEnum.STAKING,
        operatedAt: at(day),
        amount: PRECISION,
        baseValue: PRECISION,
        isEstimated: false,
        landingAccountId: ETH_ACCOUNT_ID,
        landingInstrumentId: ETH_ID,
        landingInstrumentCode: 'ETH',
        landingInstrumentType: InstrumentTypeEnum.CRYPTO,
        positionAccountId: ETH_ACCOUNT_ID,
        ...overrides
    };
};

export const valued = (day: string, units: number, value: number, overrides: Partial<YieldFactRowInterface> = {}) =>
    fact(day, { amount: Math.round(units * PRECISION), baseValue: Math.round(value * PRECISION), ...overrides });

export const tax = (day: string, value: number, positionAccountId: number | null = ETH_ACCOUNT_ID) =>
    valued(day, value, value, { transactionType: TransactionTypeEnum.EXPENSE, yieldKind: YieldKindEnum.TAX, positionAccountId });

export const position = (overrides: Partial<YieldPositionRowInterface> = {}): YieldPositionRowInterface => ({
    id: ETH_ACCOUNT_ID,
    title: 'ETH · Binance',
    type: AccountTypeEnum.CRYPTO_SYNC,
    isActive: true,
    deletedAt: null,
    interestRate: null,
    deadline: null,
    instrumentId: ETH_ID,
    instrumentCode: 'ETH',
    instrumentSymbol: 'ETH',
    instrumentType: InstrumentTypeEnum.CRYPTO,
    ...overrides
});

export const deposit = (overrides: Partial<YieldPositionRowInterface> = {}) =>
    position({
        id: DEPOSIT_ACCOUNT_ID,
        title: 'Term deposit',
        type: AccountTypeEnum.DEPOSIT,
        instrumentId: BASE_ID,
        instrumentCode: 'USD',
        instrumentSymbol: '$',
        instrumentType: InstrumentTypeEnum.FIAT,
        ...overrides
    });

export const interest = (day: string, value: number, overrides: Partial<YieldFactRowInterface> = {}) =>
    valued(day, value, value, {
        yieldKind: YieldKindEnum.INTEREST,
        landingAccountId: DEPOSIT_ACCOUNT_ID,
        landingInstrumentId: BASE_ID,
        landingInstrumentCode: 'USD',
        landingInstrumentType: InstrumentTypeEnum.FIAT,
        positionAccountId: DEPOSIT_ACCOUNT_ID,
        ...overrides
    });

export const movement = (accountId: number, day: string, units: number): YieldPositionMovementRowInterface => ({
    accountId,
    operatedAt: at(day),
    amount: Math.round(units * PRECISION)
});

const makeYieldRepositoryLayer = (world: YieldWorldInterface) =>
    Layer.mock(YieldRepository)({
        findFacts: (_scope, _baseInstrumentId, range) =>
            Effect.succeed(
                (world.facts ?? []).filter(
                    fact =>
                        (!isDefined(range?.from) || fact.operatedAt >= range.from) && (!isDefined(range?.to) || fact.operatedAt < range.to)
                )
            ),
        findPositions: () => Effect.succeed([...(world.positions ?? [])]),
        findPositionMovements: accountIds => Effect.succeed((world.movements ?? []).filter(row => accountIds.includes(row.accountId))),
        findPayouts: () => Effect.succeed([])
    });

const key = (overrides: Partial<YieldQueryKeyInterface> = {}): YieldQueryKeyInterface => ({
    range: YieldRangeEnum.YEAR,
    positionAccountId: null,
    instrumentId: null,
    group: null,
    baseInstrumentId: BASE_ID,
    ...overrides
});

const makeYieldLayer = (world: YieldWorldInterface) =>
    Layer.effect(YieldService, YieldService.make).pipe(
        Layer.provideMerge(
            Layer.effect(YieldHoldingService, YieldHoldingService.make).pipe(
                Layer.provideMerge(Layer.mergeAll(makeYieldRepositoryLayer(world), makeYieldPriceLayer(world)))
            )
        )
    );

export const summarize = (world: YieldWorldInterface, overrides: Partial<YieldQueryKeyInterface> = {}) =>
    Effect.gen(function* () {
        yield* TestClock.setTime(TODAY.getTime());

        return yield* (yield* YieldService).summarize(key(overrides));
    }).pipe(Effect.provide(makeYieldLayer(world)));

export const earnedBetween = (world: YieldWorldInterface, fromDay: string, toDay: string) =>
    Effect.flatMap(YieldService, service => service.earnedBetween(fromDay, toDay, BASE_ID)).pipe(Effect.provide(makeYieldLayer(world)));

export const mergeWorlds = (...worlds: readonly YieldWorldInterface[]): YieldWorldInterface => ({
    facts: worlds.flatMap(world => world.facts ?? []),
    positions: worlds.flatMap(world => world.positions ?? []),
    movements: worlds.flatMap(world => world.movements ?? []),
    prices: worlds.flatMap(world => world.prices ?? []),
    historicalRates: worlds.flatMap(world => world.historicalRates ?? []),
    latestRates: worlds.flatMap(world => world.latestRates ?? [])
});

export const ethStakingWorld: YieldWorldInterface = {
    positions: [position()],
    movements: [movement(ETH_ACCOUNT_ID, '2025-01-01', 10), ...ETH_REWARD_DAYS.map(day => movement(ETH_ACCOUNT_ID, day, 0.1))],
    facts: ETH_REWARD_DAYS.map(day => valued(day, 0.1, 200)),
    prices: priceRange(ETH_ID, BASE_ID, ['2025-10-01', '2026-11-13'], 2000),
    latestRates: [latestRate(ETH_ID, BASE_ID, 2000)]
};

export const ETH_AVERAGE_UNITS = 3710.1 / 365;
export const ETH_RATE = 0.4 / ETH_AVERAGE_UNITS;

export const lumpyDepositWorld = (interestRate: number | null): YieldWorldInterface => ({
    positions: [deposit({ interestRate })],
    movements: [
        movement(DEPOSIT_ACCOUNT_ID, '2026-05-01', 1000),
        movement(DEPOSIT_ACCOUNT_ID, '2026-08-01', 10),
        movement(DEPOSIT_ACCOUNT_ID, '2026-11-01', 12)
    ],
    facts: [interest('2026-08-01', 10), interest('2026-11-01', 12)]
});

export const LUMPY_RATE = (12 / (93942 / 93)) * (365 / 92);

export const solPosition = position({
    id: SOL_ACCOUNT_ID,
    title: 'SOL',
    instrumentId: SOL_ID,
    instrumentCode: 'SOL',
    instrumentSymbol: 'SOL'
});

export const solHolding = (units: number): YieldWorldInterface => ({
    positions: [solPosition],
    movements: [movement(SOL_ACCOUNT_ID, '2025-01-01', units)],
    prices: priceRange(SOL_ID, BASE_ID, ['2025-10-01', '2026-11-13'], 100)
});
