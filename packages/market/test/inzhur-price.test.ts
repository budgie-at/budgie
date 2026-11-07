import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
    AccountRepository,
    AccountTypeEnum,
    CurrencyEnum,
    InstrumentDailyMarketPriceEntityTable,
    InstrumentRepository,
    PRECISION
} from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as TestClock from 'effect/testing/TestClock';

import { isDefined } from '@rnw-community/shared';

import { InzhurPriceParseError } from '../src/market-data/error/inzhur-price-parse.error';
import { InstrumentDailyMarketPriceRepository } from '../src/market-data/repository/instrument-daily-market-price.repository';
import { HistoricalMarketDataService } from '../src/market-data/service/historical-market-data.service';
import { InzhurPriceService } from '../src/market-data/service/inzhur-price.service';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';

import { makeHtmlHttpClientLayer, setDefaultInstrument, TestLayer, testDb, testSeedService } from './test-context';

const fixtureHtml = readFileSync(join(__dirname, 'fixture', 'inzhur-home.html'), 'utf8');
const realEstateIsin = 'UA5000014044';
const energyIsin = 'UA5000012246';
const operatedAt = new Date('2026-06-03T12:00:00.000Z');

const InzhurLayer = (html: string) =>
    Layer.mergeAll(
        TestLayer,
        HistoricalMarketDataService.layer,
        AccountRepository.layer,
        InzhurPriceService.layer,
        InstrumentDailyMarketPriceRepository.layer,
        makeHtmlHttpClientLayer(html)
    );

const drainFundJob = Effect.fnUntraced(function* (instrumentId: number) {
    const historicalMarketDataService = yield* HistoricalMarketDataService;
    const accountRepository = yield* AccountRepository;

    yield* historicalMarketDataService.enqueueAccounts(yield* accountRepository.getAllActiveAccounts);

    const job = yield* historicalMarketDataService.claimNextJob;

    if (!isDefined(job) || job.instrumentId !== instrumentId) {
        return null;
    }

    yield* historicalMarketDataService.storeJobData(job, yield* historicalMarketDataService.fetchJobData(job));

    return job;
});

const drainFundJobWithPrices = Effect.fnUntraced(function* (instrumentId: number) {
    const job = yield* drainFundJob(instrumentId);
    const prices = yield* testDb
        .select()
        .from(InstrumentDailyMarketPriceEntityTable)
        .where(eq(InstrumentDailyMarketPriceEntityTable.instrumentId, instrumentId));

    return { job, prices };
});

const prepareFundAccount = Effect.fnUntraced(function* (isin: string) {
    const instrumentRepository = yield* InstrumentRepository;
    const fund = yield* Effect.flatMap(instrumentRepository.findByCode(isin), Effect.fromNullishOr);
    const dollar = yield* Effect.flatMap(instrumentRepository.findByCode(CurrencyEnum.USD), Effect.fromNullishOr);
    const hryvnia = yield* Effect.flatMap(instrumentRepository.findByCode(CurrencyEnum.UAH), Effect.fromNullishOr);

    yield* testDb.delete(InstrumentDailyMarketPriceEntityTable).where(eq(InstrumentDailyMarketPriceEntityTable.instrumentId, fund.id));
    yield* TestClock.setTime(operatedAt.getTime());
    yield* setDefaultInstrument(dollar.id);

    const account = yield* testSeedService.account({ instrumentId: fund.id, type: AccountTypeEnum.STOCKS });

    return { fund, dollar, hryvnia, account };
});

describe('inzhur certificate prices', () => {
    it.effect('reads the certificate price of each fund named on the saved page', () =>
        Effect.gen(function* () {
            const inzhurPriceService = yield* InzhurPriceService;

            expect(yield* inzhurPriceService.fetchPrices).toStrictEqual([
                { fundName: 'Inzhur MilTech', price: 1053.7456 },
                { fundName: 'Inzhur REIT', price: 11.675 },
                { fundName: 'Inzhur Energy', price: 6742.3637 }
            ]);
        }).pipe(Effect.provide(InzhurLayer(fixtureHtml)))
    );

    it.effect('fails with a typed parse error when the page layout changes', () =>
        Effect.gen(function* () {
            const inzhurPriceService = yield* InzhurPriceService;
            const error = yield* Effect.flip(inzhurPriceService.fetchPrices);

            expect(error).toBeInstanceOf(InzhurPriceParseError);
            expect(error._tag).toBe('InzhurPriceParseError');
        }).pipe(Effect.provide(InzhurLayer('<html><body>redesigned</body></html>')))
    );

    it.effect('rejects a non-positive certificate price', () =>
        Effect.gen(function* () {
            const inzhurPriceService = yield* InzhurPriceService;
            const error = yield* Effect.flip(inzhurPriceService.fetchPrices);

            expect(error._tag).toBe('InzhurPriceParseError');
        }).pipe(Effect.provide(InzhurLayer(fixtureHtml.replace('&quot;11.675&quot;', '&quot;0&quot;'))))
    );

    it.effect('stores the daily price in hryvnia and values a fund account in the base currency', () =>
        Effect.gen(function* () {
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const inzhurPriceService = yield* InzhurPriceService;
            const { fund, dollar, hryvnia, account } = yield* prepareFundAccount(realEstateIsin);
            const { job, prices } = yield* drainFundJobWithPrices(fund.id);
            const hryvniaToDollar = yield* entryBaseValuationService.resolveHistoricalBaseExchangeRateOrNull(
                hryvnia.id,
                dollar.id,
                operatedAt
            );
            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: account.id,
                amount: 100 * PRECISION,
                operatedAt
            });

            expect(job?.quoteInstrumentId).toBe(hryvnia.id);
            expect(prices.map(({ price, priceDate, quoteInstrumentId }) => ({ price, priceDate, quoteInstrumentId }))).toStrictEqual([
                { price: 11.675, priceDate: '2026-06-03', quoteInstrumentId: hryvnia.id }
            ]);
            expect(hryvniaToDollar).toBeGreaterThan(0);
            expect(valuation.baseAmount).toBe(Math.round(100 * PRECISION * 11.675 * (hryvniaToDollar ?? 0)));
            expect(yield* inzhurPriceService.findNearestPrice(fund.id, '2026-06-10')).toBe(11.675);
            expect(yield* inzhurPriceService.findNearestPrice(fund.id, '2026-06-02')).toBe(11.675);
            expect(yield* drainFundJob(fund.id)).toBeNull();
        }).pipe(Effect.provide(InzhurLayer(fixtureHtml)))
    );

    it.effect('picks the stored price nearest to the date, whether it was stored before or after', () =>
        Effect.gen(function* () {
            const inzhurPriceService = yield* InzhurPriceService;
            const instrumentDailyMarketPriceRepository = yield* InstrumentDailyMarketPriceRepository;
            const { fund, hryvnia } = yield* prepareFundAccount(realEstateIsin);
            const buildPrice = (priceDate: string, price: number) => ({
                instrumentId: fund.id,
                quoteInstrumentId: hryvnia.id,
                priceDate,
                price,
                marketCap: null,
                volume: null,
                source: 'inzhur.reit'
            });

            yield* instrumentDailyMarketPriceRepository.bulkUpsert([buildPrice('2026-06-03', 11), buildPrice('2026-06-20', 12)]);

            expect(yield* inzhurPriceService.findNearestPrice(fund.id, '2026-06-10')).toBe(11);
            expect(yield* inzhurPriceService.findNearestPrice(fund.id, '2026-06-12')).toBe(12);
            expect(yield* inzhurPriceService.findNearestPrice(fund.id, '2026-07-30')).toBe(12);
        }).pipe(Effect.provide(InzhurLayer(fixtureHtml)))
    );

    it.effect('skips a fund that is not on the page without failing the job', () =>
        Effect.gen(function* () {
            const { fund } = yield* prepareFundAccount(realEstateIsin);
            const { job, prices } = yield* drainFundJobWithPrices(fund.id);

            expect(job).not.toBeNull();
            expect(prices).toStrictEqual([]);
        }).pipe(Effect.provide(InzhurLayer(fixtureHtml.replaceAll('Inzhur REIT', 'Inzhur Other'))))
    );

    it.effect('leaves a fund entry unvalued instead of dying while no price is stored', () =>
        Effect.gen(function* () {
            const entryBaseValuationService = yield* EntryBaseValuationService;
            const { account } = yield* prepareFundAccount(energyIsin);
            const valuation = yield* entryBaseValuationService.valueMicroUnitEntry({
                accountId: account.id,
                amount: 5 * PRECISION,
                operatedAt
            });

            expect(valuation).toStrictEqual({ baseInstrumentId: null, baseExchangeRate: null, baseAmount: null });
        }).pipe(Effect.provide(InzhurLayer(fixtureHtml)))
    );
    it.effect('dates a delayed scraped sample by the fetch day rather than the enqueue day', () =>
        Effect.gen(function* () {
            const { fund } = yield* prepareFundAccount(realEstateIsin);
            const historicalMarketDataService = yield* HistoricalMarketDataService;
            const accountRepository = yield* AccountRepository;

            yield* historicalMarketDataService.enqueueAccounts(yield* accountRepository.getAllActiveAccounts);

            const job = yield* Effect.flatMap(historicalMarketDataService.claimNextJob, Effect.fromNullishOr);

            yield* TestClock.setTime(new Date('2026-06-05T12:00:00.000Z').getTime());
            yield* historicalMarketDataService.storeJobData(job, yield* historicalMarketDataService.fetchJobData(job));

            const prices = yield* testDb
                .select()
                .from(InstrumentDailyMarketPriceEntityTable)
                .where(eq(InstrumentDailyMarketPriceEntityTable.instrumentId, fund.id));

            expect(prices.map(price => price.priceDate)).toEqual(['2026-06-05']);
        }).pipe(Effect.provide(InzhurLayer(fixtureHtml)))
    );
});
