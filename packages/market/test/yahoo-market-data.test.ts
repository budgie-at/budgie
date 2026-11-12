import {
    AccountRepository,
    AccountTypeEnum,
    InstrumentMarketDataJobStatusEnum,
    InstrumentPriceProviderEnum,
    InstrumentRepository,
    InstrumentTypeEnum
} from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import * as TestClock from 'effect/testing/TestClock';

import { ExchangeRateRepository } from '../src/exchange-rate/repository/exchange-rate.repository';
import { ExchangeRatesSyncService } from '../src/exchange-rate/service/exchange-rates-sync.service';
import { HistoricalExchangeRateRepository } from '../src/historical-exchange-rate/repository/historical-exchange-rate.repository';
import { InstrumentMarketDataJobRepository } from '../src/market-data/repository/instrument-market-data-job.repository';
import { HistoricalMarketDataService } from '../src/market-data/service/historical-market-data.service';
import { YahooMarketDataService } from '../src/market-data/service/yahoo-market-data.service';

import { makeRoutedFakeHttpClientLayer, setDefaultInstrument, TestLayer, testSeedService } from './test-context';

const chartBody = {
    chart: {
        result: [
            { meta: { currency: 'EUR', regularMarketPrice: 100 }, timestamp: [1794355200], indicators: { quote: [{ close: [100] }] } }
        ],
        error: null
    }
};
const listing = { symbol: 'TEST.DE', name: 'Test stock', exchange: 'XETRA', type: InstrumentTypeEnum.EQUITY } as const;
const YahooHttpLayer = makeRoutedFakeHttpClientLayer(url => {
    if (url.pathname.includes('search')) {
        return {
            quotes: [
                { symbol: 'TEST.DE', longname: 'Test stock', exchDisp: 'XETRA', quoteType: 'EQUITY' },
                { symbol: 'IGNORE', quoteType: 'INDEX' }
            ]
        };
    }
    if (url.pathname.includes('chart')) {
        return chartBody;
    }

    return { base: 'USD', date: '2026-11-11', rates: { USD: 1, EUR: 0.8 } };
});
const YahooLayer = Layer.mergeAll(
    TestLayer,
    YahooMarketDataService.layer,
    ExchangeRatesSyncService.layer,
    AccountRepository.layer,
    InstrumentMarketDataJobRepository.layer,
    HistoricalMarketDataService.layer
).pipe(Layer.provideMerge(YahooHttpLayer));

it.effect('decodes listings, resolves currency and writes direct USD base rates from EUR prices', () =>
    Effect.gen(function* () {
        const yahoo = yield* YahooMarketDataService;
        const instruments = yield* InstrumentRepository;
        const accounts = yield* AccountRepository;
        const sync = yield* ExchangeRatesSyncService;
        const rates = yield* ExchangeRateRepository;
        const history = yield* HistoricalMarketDataService;
        const historicalRates = yield* HistoricalExchangeRateRepository;
        const euro = yield* Effect.flatMap(instruments.findByCode('EUR'), Effect.fromNullishOr);
        const dollar = yield* Effect.flatMap(instruments.findByCode('USD'), Effect.fromNullishOr);
        yield* setDefaultInstrument(dollar.id);
        expect(yield* yahoo.search('Test')).toStrictEqual([listing]);
        const instrument = yield* yahoo.resolveOrCreate(listing, 'DE0001234567');
        expect(instrument.quoteInstrumentId).toBe(euro.id);
        expect((yield* yahoo.resolveOrCreate(listing, 'DE0001234567')).id).toBe(instrument.id);
        const account = yield* testSeedService.account({ instrumentId: instrument.id, type: AccountTypeEnum.STOCKS });
        const syncing = yield* sync.sync().pipe(Effect.forkChild);
        yield* TestClock.adjust('1 second');
        yield* Fiber.join(syncing);
        expect((yield* rates.findByBaseAndQuoteIds(instrument.id, dollar.id))?.rate).toBeCloseTo(125);
        yield* history.enqueueAccounts([account]);
        const job = yield* Effect.fromNullishOr(yield* history.claimNextJob);
        expect(job.quoteInstrumentId).toBe(euro.id);
        yield* history.storeJobData(job, yield* history.fetchJobData(job));
        expect((yield* historicalRates.findForDateOrBefore(instrument.id, dollar.id, '2026-11-11'))?.rate).toBeCloseTo(125);
        expect((yield* accounts.getAllActiveAccounts).some(value => value.id === account.id)).toBe(true);
    }).pipe(Effect.provide(YahooLayer))
);

it.effect('keeps an existing quote when Yahoo returns an unavailable symbol', () =>
    Effect.gen(function* () {
        const yahoo = yield* YahooMarketDataService;
        expect(yield* yahoo.chart('MISSING', new Date('2026-11-01'), new Date('2026-11-12'))).toBeNull();
    }).pipe(
        Effect.provide(
            YahooMarketDataService.layer.pipe(
                Layer.provide([TestLayer, makeRoutedFakeHttpClientLayer(() => ({ chart: { result: null, error: { code: 'Not Found' } } }))])
            )
        )
    )
);

it.effect('retains a known security price when Yahoo responses cannot be decoded', () =>
    Effect.gen(function* () {
        const instruments = yield* InstrumentRepository;
        const rates = yield* ExchangeRateRepository;
        const sync = yield* ExchangeRatesSyncService;
        const dollar = yield* Effect.flatMap(instruments.findByCode('USD'), Effect.fromNullishOr);
        const instrument = yield* instruments.create({
            name: 'Unavailable ETF',
            symbol: 'FAILTEST',
            code: 'FAILTEST',
            type: InstrumentTypeEnum.ETF,
            priceProvider: InstrumentPriceProviderEnum.YAHOO,
            providerInstrumentId: 'FAILTEST',
            quoteInstrumentId: dollar.id
        });
        yield* testSeedService.account({ instrumentId: instrument.id, type: AccountTypeEnum.STOCKS });
        yield* setDefaultInstrument(dollar.id);
        yield* rates.bulkUpsert([{ baseInstrumentId: instrument.id, quoteInstrumentId: dollar.id, rate: 123, source: 'previous' }]);
        const syncing = yield* sync.sync().pipe(Effect.forkChild);
        yield* TestClock.adjust('20 seconds');
        yield* Fiber.join(syncing);
        expect((yield* rates.findByBaseAndQuoteIds(instrument.id, dollar.id))?.rate).toBe(123);
    }).pipe(
        Effect.provide(
            Layer.mergeAll(TestLayer, ExchangeRatesSyncService.layer).pipe(
                Layer.provideMerge(makeRoutedFakeHttpClientLayer(() => ({ base: 'USD', date: '2026-11-11', rates: { USD: 1 } })))
            )
        )
    )
);

it.effect('marks a missing Yahoo symbol as unsupported in the existing job', () =>
    Effect.gen(function* () {
        const instruments = yield* InstrumentRepository;
        const history = yield* HistoricalMarketDataService;
        const jobs = yield* InstrumentMarketDataJobRepository;
        const dollar = yield* Effect.flatMap(instruments.findByCode('USD'), Effect.fromNullishOr);
        const instrument = yield* instruments.create({
            code: 'UNKNOWN',
            name: 'Unknown',
            symbol: 'UNKNOWN',
            type: InstrumentTypeEnum.EQUITY,
            priceProvider: InstrumentPriceProviderEnum.YAHOO,
            providerInstrumentId: 'UNKNOWN',
            quoteInstrumentId: dollar.id
        });
        const account = yield* testSeedService.account({ instrumentId: instrument.id, type: AccountTypeEnum.STOCKS });
        yield* history.enqueueAccounts([account]);
        const job = yield* Effect.fromNullishOr(yield* history.claimNextJob);
        yield* history.storeJobData(job, { prices: [], rates: [], unsupportedInstruments: [instrument] });
        expect((yield* jobs.findLatestByInstrumentAndQuote(instrument.id, dollar.id))?.status).toBe(
            InstrumentMarketDataJobStatusEnum.UNSUPPORTED
        );
    }).pipe(Effect.provide(YahooLayer))
);
