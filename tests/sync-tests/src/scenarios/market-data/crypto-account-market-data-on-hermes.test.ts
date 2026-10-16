import {
    AccountTypeEnum,
    CurrencyEnum,
    InstrumentDailyMarketPriceEntityTable,
    InstrumentEntityTable,
    SettingsEntityTable
} from '@budgie/contracts';
import { HistoricalMarketDataService } from '@budgie/market';
import { afterEach, beforeEach, describe, expect, it, vi } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { http, HttpResponse } from 'msw';

import { isDefined } from '@rnw-community/shared';

import { requireInstrument, seed, testDb, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const dayMs = 86_400_000;
const moneroPrice = 312.5;

const buildDailyRates = (fromDate: string, toDate: string) =>
    Array.from({ length: Math.floor((Date.parse(toDate) - Date.parse(fromDate)) / dayMs) + 1 }, (_, index) => ({
        date: new Date(Date.parse(fromDate) + index * dayMs).toISOString().slice(0, 10),
        base: CurrencyEnum.EUR,
        quote: CurrencyEnum.USD,
        rate: 1.12
    }));

const stubMarketDataApis = () => {
    mockServer.use(
        http.get('https://api.frankfurter.dev/v2/currencies', () => HttpResponse.json([{ iso_code: CurrencyEnum.USD }])),
        http.get('https://api.frankfurter.dev/v2/rates', ({ request }) => {
            const { searchParams } = new URL(request.url);

            return HttpResponse.json(buildDailyRates(searchParams.get('from') ?? '', searchParams.get('to') ?? ''));
        }),
        http.get('https://api.coingecko.com/api/v3/coins/monero/market_chart/range', () => {
            const prices = Array.from({ length: 30 }, (_, index) => [Date.now() - index * dayMs, moneroPrice]);

            return HttpResponse.json({ prices, market_caps: prices, total_volumes: prices });
        })
    );
};

const drainJobs = Effect.gen(function* () {
    const historicalMarketDataService = yield* HistoricalMarketDataService;
    const job = yield* historicalMarketDataService.claimNextJob();

    if (!isDefined(job)) {
        return false;
    }

    yield* historicalMarketDataService.storeJobData(job, yield* historicalMarketDataService.fetchJobData(job));

    return true;
}).pipe(Effect.repeat({ while: hasClaimedJob => hasClaimedJob }));

describe('market-data/crypto-account-market-data-on-hermes', () => {
    beforeEach(() => {
        vi.spyOn(Array.prototype, 'toSorted').mockImplementation(() => {
            throw new TypeError('Array.prototype.toSorted is not a function');
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.effect('stores a monero price for a new crypto account on a runtime without Array.prototype.toSorted', () =>
        Effect.gen(function* () {
            const historicalMarketDataService = yield* HistoricalMarketDataService;
            const dollar = yield* requireInstrument(CurrencyEnum.USD);
            const [monero] = yield* testDb.select().from(InstrumentEntityTable).where(eq(InstrumentEntityTable.code, 'XMR'));
            const moneroInstrument = yield* Effect.fromNullishOr(monero);

            stubMarketDataApis();
            yield* testDb.update(SettingsEntityTable).set({ defaultInstrumentId: dollar.id });

            const account = yield* seed.account({ instrumentId: moneroInstrument.id, type: AccountTypeEnum.CRYPTO });

            yield* historicalMarketDataService.enqueueAccounts([account]);
            yield* drainJobs;

            const moneroPrices = yield* testDb
                .select()
                .from(InstrumentDailyMarketPriceEntityTable)
                .where(eq(InstrumentDailyMarketPriceEntityTable.instrumentId, moneroInstrument.id));

            expect(moneroPrices.at(0)?.quoteInstrumentId).toBe(dollar.id);
            expect(moneroPrices.at(0)?.price).toBe(moneroPrice);
        }).pipe(Effect.provide(HistoricalMarketDataService.layer.pipe(Layer.provideMerge(TestLayer))))
    );
});
