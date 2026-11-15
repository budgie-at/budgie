import { AccountTypeEnum, CurrencyEnum, InstrumentTypeEnum, PRECISION } from '@budgie/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { HistoricalExchangeRateRepository } from '../src/historical-exchange-rate/repository/historical-exchange-rate.repository';
import { InstrumentDailyMarketPriceRepository } from '../src/market-data/repository/instrument-daily-market-price.repository';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';

import { requireInstrumentByCode, setDefaultInstrument, TestLayer, testSeedService } from './test-context';

const seedCoinAccount = Effect.fnUntraced(function* (code: string) {
    const euro = yield* requireInstrumentByCode(CurrencyEnum.EUR);
    const coin = yield* testSeedService.instrument({ code, name: code, symbol: code, type: InstrumentTypeEnum.CRYPTO });
    const account = yield* testSeedService.account({ instrumentId: coin.id, type: AccountTypeEnum.CRYPTO_SYNC });

    yield* setDefaultInstrument(euro.id);

    return { euro, coin, account };
});

const writeRate = (sourceInstrumentId: number, targetInstrumentId: number, rateDate: string, rate: number) =>
    Effect.flatMap(HistoricalExchangeRateRepository, repository =>
        repository.bulkUpsert([{ sourceInstrumentId, targetInstrumentId, rateDate, rate }])
    );

const valueAt = (accountId: number, operatedAt: string) =>
    Effect.flatMap(EntryBaseValuationService, service =>
        service.valueMicroUnitEntry({ accountId, amount: 2 * PRECISION, operatedAt: new Date(operatedAt) })
    );

describe('price day', () => {
    beforeEach(() => {
        vi.stubEnv('TZ', 'Europe/Moscow');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it.effect('values an entry made at 01:30 on a UTC+3 device with the price of its UTC date', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedCoinAccount('TUTC1');

            yield* writeRate(coin.id, euro.id, '2026-03-10', 100);
            yield* writeRate(coin.id, euro.id, '2026-03-11', 120);

            expect(yield* valueAt(account.id, '2026-03-10T22:30:00.000Z')).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: 100,
                baseAmount: 200 * PRECISION
            });
        }).pipe(Effect.provide(TestLayer))
    );
});

const seedBankAccount = Effect.fnUntraced(function* (code: CurrencyEnum) {
    const euro = yield* requireInstrumentByCode(CurrencyEnum.EUR);
    const instrument = yield* requireInstrumentByCode(code);
    const account = yield* testSeedService.account({ instrumentId: instrument.id, type: AccountTypeEnum.BANK });

    yield* setDefaultInstrument(euro.id);

    return { euro, instrument, account };
});

const seedStablecoinAccount = Effect.fnUntraced(function* (code: string) {
    const euro = yield* requireInstrumentByCode(CurrencyEnum.EUR);
    const coin = yield* requireInstrumentByCode(code);
    const account = yield* testSeedService.account({ instrumentId: coin.id, type: AccountTypeEnum.CRYPTO_SYNC });

    yield* setDefaultInstrument(euro.id);

    return { euro, coin, account };
});

describe('strict crypto hop', () => {
    it.effect('prices an entry with the exact day price', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedCoinAccount('TSH1');

            yield* writeRate(coin.id, euro.id, '2026-03-10', 100);

            expect(yield* valueAt(account.id, '2026-03-10T12:00:00.000Z')).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: 100,
                baseAmount: 200 * PRECISION
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('prices an entry with a price at most 3 days older', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedCoinAccount('TSH2');

            yield* writeRate(coin.id, euro.id, '2026-03-07', 100);

            expect((yield* valueAt(account.id, '2026-03-10T12:00:00.000Z')).baseExchangeRate).toBe(100);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('stores a 4-day-old price as an Estimated value', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedCoinAccount('TSH3');

            yield* writeRate(coin.id, euro.id, '2026-03-06', 100);

            expect(yield* valueAt(account.id, '2026-03-10T12:00:00.000Z')).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: null,
                baseAmount: 200 * PRECISION
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('bridges a klines USDT price to the base through the stored USDT rate', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedCoinAccount('TSH4');
            const tether = yield* requireInstrumentByCode('USDT');

            yield* writeRate(coin.id, tether.id, '2024-05-10', 50);
            yield* writeRate(tether.id, euro.id, '2024-05-10', 0.9);

            expect(yield* valueAt(account.id, '2024-05-10T08:00:00.000Z')).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: 45,
                baseAmount: 90 * PRECISION
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('honours a stored stablecoin depeg price', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedStablecoinAccount('USDC');

            yield* writeRate(coin.id, euro.id, '2023-03-11', 0.82);

            expect((yield* valueAt(account.id, '2023-03-11T12:00:00.000Z')).baseExchangeRate).toBe(0.82);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('values an unpriced stablecoin day at one dollar and marks it Estimated', () =>
        Effect.gen(function* () {
            const { euro, coin, account } = yield* seedStablecoinAccount('USDC');
            const dollar = yield* requireInstrumentByCode(CurrencyEnum.USD);

            yield* writeRate(coin.id, euro.id, '2026-09-01', 0.82);
            yield* writeRate(dollar.id, euro.id, '2026-09-04', 0.9);

            expect(yield* valueAt(account.id, '2026-09-10T12:00:00.000Z')).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: null,
                baseAmount: 1.8 * PRECISION
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves every base field empty when an unpriced crypto day has no rate to fall back on', () =>
        Effect.gen(function* () {
            const { account } = yield* seedCoinAccount('TSH5');

            expect(yield* valueAt(account.id, '2026-03-10T12:00:00.000Z')).toStrictEqual({
                baseInstrumentId: null,
                baseExchangeRate: null,
                baseAmount: null
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps fiat valuation unchanged, old rates included', () =>
        Effect.gen(function* () {
            const { euro, instrument, account } = yield* seedBankAccount(CurrencyEnum.UAH);

            yield* writeRate(instrument.id, euro.id, '2026-07-01', 0.025);

            expect((yield* valueAt(account.id, '2026-09-10T12:00:00.000Z')).baseExchangeRate).toBe(0.025);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('strict FUND hop', () => {
    const seedFund = Effect.fnUntraced(function* (code: string) {
        const euro = yield* requireInstrumentByCode(CurrencyEnum.EUR);
        const hryvnia = yield* requireInstrumentByCode(CurrencyEnum.UAH);
        const fund = yield* testSeedService.instrument({
            code,
            name: code,
            symbol: code,
            type: InstrumentTypeEnum.FUND,
            quoteInstrumentId: hryvnia.id
        });
        const account = yield* testSeedService.account({ instrumentId: fund.id, type: AccountTypeEnum.STOCKS });

        yield* setDefaultInstrument(euro.id);
        yield* writeRate(hryvnia.id, euro.id, '2026-08-01', 0.02);

        return { euro, hryvnia, fund, account };
    });

    const writeNav = (fundId: number, hryvniaId: number, priceDate: string, price: number) =>
        Effect.flatMap(InstrumentDailyMarketPriceRepository, repository =>
            repository.bulkUpsert([
                { instrumentId: fundId, quoteInstrumentId: hryvniaId, priceDate, price, marketCap: null, volume: null, source: 'test' }
            ])
        ).pipe(Effect.andThen(writeRate(fundId, hryvniaId, priceDate, price)));

    it.effect('prices a FUND entry with a NAV 20 days later', () =>
        Effect.gen(function* () {
            const { euro, hryvnia, fund, account } = yield* seedFund('TFD1');

            yield* writeNav(fund.id, hryvnia.id, '2026-08-30', 1000);

            expect(yield* valueAt(account.id, '2026-08-10T12:00:00.000Z')).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: 20,
                baseAmount: 40 * PRECISION
            });
        }).pipe(Effect.provide(TestLayer.pipe(Layer.provideMerge(InstrumentDailyMarketPriceRepository.layer))))
    );

    it.effect('leaves every base field empty when a FUND has no NAV to fall back on', () =>
        Effect.gen(function* () {
            const { account } = yield* seedFund('TFD3');

            expect(yield* valueAt(account.id, '2026-08-11T12:00:00.000Z')).toStrictEqual({
                baseInstrumentId: null,
                baseExchangeRate: null,
                baseAmount: null
            });
        }).pipe(Effect.provide(TestLayer.pipe(Layer.provideMerge(InstrumentDailyMarketPriceRepository.layer))))
    );

    it.effect('stores a FUND entry 40 days from any NAV as an Estimated value', () =>
        Effect.gen(function* () {
            const { euro, hryvnia, fund, account } = yield* seedFund('TFD2');

            yield* writeNav(fund.id, hryvnia.id, '2026-07-02', 1000);

            expect(yield* valueAt(account.id, '2026-08-11T12:00:00.000Z')).toStrictEqual({
                baseInstrumentId: euro.id,
                baseExchangeRate: null,
                baseAmount: 40 * PRECISION
            });
        }).pipe(Effect.provide(TestLayer.pipe(Layer.provideMerge(InstrumentDailyMarketPriceRepository.layer))))
    );
});
