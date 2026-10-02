import { buildTestDb, makeTestPlatformLayer, resetTestDb, TestSeedService } from '@budgie-at/test-kit';
import { InstrumentRepository, SettingsEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as HttpClient from 'effect/http/HttpClient';
import * as HttpClientResponse from 'effect/http/HttpClientResponse';
import * as Layer from 'effect/Layer';
import { afterAll, beforeEach } from 'vitest';

import { ExchangeRateRepository } from '../src/exchange-rate/repository/exchange-rate.repository';
import { ExchangeRatesSyncService } from '../src/exchange-rate/service/exchange-rates-sync.service';
import { ExchangeRatesService } from '../src/exchange-rate/service/exchange-rates.service';
import { HistoricalExchangeRateRepository } from '../src/historical-exchange-rate/repository/historical-exchange-rate.repository';
import { EntryBaseValuationService } from '../src/valuation/service/entry-base-valuation.service';

export const testDbHandle = await buildTestDb();

export const testDb = testDbHandle.database;

export const testSeedService = new TestSeedService(testDb);

beforeEach(() => Effect.runPromise(resetTestDb(testDb)));

afterAll(() => testDbHandle.dispose());

export const setDefaultInstrument = (defaultInstrumentId: number) => testDb.update(SettingsEntityTable).set({ defaultInstrumentId });

export const makeFakeHttpClientLayer = (body: unknown) =>
    Layer.succeed(
        HttpClient.HttpClient,
        HttpClient.make(request => Effect.succeed(HttpClientResponse.fromWeb(request, new Response(JSON.stringify(body), { status: 200 }))))
    );

export const TestLayer = Layer.mergeAll(
    ExchangeRatesService.layer,
    ExchangeRatesSyncService.layer,
    EntryBaseValuationService.layer,
    ExchangeRateRepository.layer,
    HistoricalExchangeRateRepository.layer,
    InstrumentRepository.layer
).pipe(Layer.provideMerge(makeTestPlatformLayer(testDb)));
