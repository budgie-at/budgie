import { CurrencyEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as Layer from 'effect/Layer';
import * as TestClock from 'effect/testing/TestClock';

import { ExchangeRateRepository } from '../src/exchange-rate/repository/exchange-rate.repository';
import { ExchangeRatesSyncService } from '../src/exchange-rate/service/exchange-rates-sync.service';

import { makeStatusHttpClientLayer, requireInstrumentByCode, setDefaultInstrument, TestLayer } from './test-context';

const runSyncWithClockAdvance = Effect.fnUntraced(function* () {
    const exchangeRatesSyncService = yield* ExchangeRatesSyncService;
    const fiber = yield* Effect.forkChild(exchangeRatesSyncService.sync());

    yield* TestClock.adjust('5 seconds');
    yield* Fiber.join(fiber);
});

const seedEuroDollarRate = Effect.fnUntraced(function* () {
    const exchangeRateRepository = yield* ExchangeRateRepository;
    const euro = yield* requireInstrumentByCode(CurrencyEnum.EUR);
    const dollar = yield* requireInstrumentByCode(CurrencyEnum.USD);

    yield* setDefaultInstrument(euro.id);
    yield* exchangeRateRepository.bulkUpsert([{ baseInstrumentId: euro.id, quoteInstrumentId: dollar.id, rate: 1.08, source: 'previous' }]);

    return { exchangeRateRepository, euro, dollar };
});

describe('exchange rates sync service', () => {
    it.effect('preserves stored EUR/USD exchange rate when fiat fetch fails for a non-USD base currency', () =>
        Effect.gen(function* () {
            const { exchangeRateRepository, euro, dollar } = yield* seedEuroDollarRate();

            yield* runSyncWithClockAdvance();

            expect((yield* exchangeRateRepository.findByBaseAndQuoteIds(euro.id, dollar.id))?.rate).toBe(1.08);
        }).pipe(
            Effect.provide(
                Layer.mergeAll(TestLayer, ExchangeRatesSyncService.layer).pipe(
                    Layer.provideMerge(makeStatusHttpClientLayer(() => ({ status: 503, body: {} })))
                )
            )
        )
    );

    it.effect('does not set cooldown when all provider fetches fail so a subsequent sync retries immediately', () => {
        let shouldFail = true;
        let fiatFetchAttempts = 0;

        return Effect.gen(function* () {
            const { exchangeRateRepository, euro, dollar } = yield* seedEuroDollarRate();

            yield* runSyncWithClockAdvance();

            expect(fiatFetchAttempts).toBeGreaterThan(0);
            expect((yield* exchangeRateRepository.findByBaseAndQuoteIds(euro.id, dollar.id))?.rate).toBe(1.08);

            const attemptsAfterFailure = fiatFetchAttempts;
            shouldFail = false;

            yield* runSyncWithClockAdvance();

            expect(fiatFetchAttempts).toBeGreaterThan(attemptsAfterFailure);
            expect((yield* exchangeRateRepository.findByBaseAndQuoteIds(euro.id, dollar.id))?.rate).toBe(1.12);
        }).pipe(
            Effect.provide(
                Layer.mergeAll(TestLayer, ExchangeRatesSyncService.layer).pipe(
                    Layer.provideMerge(
                        makeStatusHttpClientLayer(url => {
                            if (url.hostname === 'api.exchangerate-api.com') {
                                fiatFetchAttempts += 1;

                                return shouldFail
                                    ? { status: 503, body: {} }
                                    : { status: 200, body: { base: 'EUR', date: '2026-11-24', rates: { USD: 1.12 } } };
                            }

                            return { status: 503, body: {} };
                        })
                    )
                )
            )
        );
    });
});
