import { buildTestDb, makeTestPlatformLayer, resetTestDb, TestSeedService } from '@budgie-at/test-kit';
import { InstrumentRepository, SettingsEntityTable, TransactionEntryBaseValuationRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';
import * as Layer from 'effect/Layer';
import * as Schema from 'effect/Schema';
import { beforeEach } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { ExchangeRateRepository } from '../src/exchange-rate/repository/exchange-rate.repository';
import { ExchangeRatesSyncService } from '../src/exchange-rate/service/exchange-rates-sync.service';
import { ExchangeRatesService } from '../src/exchange-rate/service/exchange-rates.service';
import { HistoricalExchangeRateRepository } from '../src/historical-exchange-rate/repository/historical-exchange-rate.repository';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';

export const testDb = await buildTestDb();

export const testSeedService = new TestSeedService(testDb);

beforeEach(() => Effect.runPromise(resetTestDb(testDb)));

export const setDefaultInstrument = (defaultInstrumentId: number) => testDb.update(SettingsEntityTable).set({ defaultInstrumentId });

const encodeJson = Schema.encodeSync(Schema.fromJsonString(Schema.Unknown));

export const makeStatusHttpClientLayer = (respond: (url: URL) => { readonly status: number; readonly body: unknown }) =>
    Layer.succeed(
        HttpClient.HttpClient,
        HttpClient.make((request, url) =>
            Effect.sync(() => {
                const { status, body } = respond(url);

                return HttpClientResponse.fromWeb(request, new Response(encodeJson(body), { status }));
            })
        )
    );

export const makeRoutedFakeHttpClientLayer = (resolveBody: (url: URL) => unknown) =>
    makeStatusHttpClientLayer(url => ({ status: 200, body: resolveBody(url) }));

export const makeFakeHttpClientLayer = (body: unknown) => makeRoutedFakeHttpClientLayer(() => body);

export const TestLayer = Layer.mergeAll(
    ExchangeRatesService.layer,
    ExchangeRatesSyncService.layer,
    EntryBaseValuationService.layer,
    ExchangeRateRepository.layer,
    HistoricalExchangeRateRepository.layer,
    InstrumentRepository.layer,
    TransactionEntryBaseValuationRepository.layer
).pipe(Layer.provideMerge(makeTestPlatformLayer(testDb)));

export const makeHtmlHttpClientLayer = (html: string) =>
    Layer.succeed(
        HttpClient.HttpClient,
        HttpClient.make((request, _url) => Effect.succeed(HttpClientResponse.fromWeb(request, new Response(html, { status: 200 }))))
    );

export const requireInstrumentByCode = Effect.fnUntraced(function* (code: string) {
    const instrumentRepository = yield* InstrumentRepository;
    const instrument = yield* instrumentRepository.findByCode(code);

    return isDefined(instrument) ? instrument : yield* Effect.die(new Error(`Instrument ${code} missing`));
});
