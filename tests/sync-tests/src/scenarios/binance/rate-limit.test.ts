import { BinanceSignedClient } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';

import {
    BINANCE_TEST_TOKEN,
    BINANCE_WINDOW_FROM,
    BINANCE_WINDOW_TO,
    DEPOSIT_URL,
    EMPTY_FIAT_RESPONSE,
    FIAT_ORDERS_URL,
    buildBinance,
    stubBinanceServerTime,
    stubEmptyBinanceSources,
    withCoolDownSpy,
    TestLayer
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const NEAR_CEILING_UID_WEIGHT = '80000';
const COOL_DOWN_WINDOW_MS = 60_000;
const USED_WEIGHT_HEADER = 'x-sapi-used-uid-weight-1m';

describe('binance/rate-limit', () => {
    it.effect('returns a dedicated deferred error when the signed request deadline has expired', () =>
        Effect.gen(function* () {
            stubBinanceServerTime();

            const client = new BinanceSignedClient(BINANCE_TEST_TOKEN, Date.now() - 1);
            const error = yield* Effect.flip(client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO));

            expect(error._tag).toBe('SyncDeferredError');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('maps a 429 deposit response to a rate-limited error', () =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            mockServer.use(http.get(DEPOSIT_URL, () => new HttpResponse(null, { status: 429 })));

            const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
            const error = yield* Effect.flip(client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO));

            expect(error._tag).toBe('SyncRateLimitedError');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('schedules a cool-down before the next heavy call when used-weight crosses the ceiling threshold', () =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            mockServer.use(
                http.get(DEPOSIT_URL, () =>
                    HttpResponse.json([buildBinance.deposit({ id: 'dep-1', coin: 'BTC', amount: '1' })], {
                        headers: { [USED_WEIGHT_HEADER]: NEAR_CEILING_UID_WEIGHT }
                    })
                )
            );

            const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
            const coolDownDelays = yield* withCoolDownSpy(
                COOL_DOWN_WINDOW_MS,
                Effect.gen(function* () {
                    yield* client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO);

                    yield* client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO + 1);
                })
            );

            expect(coolDownDelays).toContain(COOL_DOWN_WINDOW_MS);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('schedules a cool-down before the next heavy call when fiat used-weight crosses the ceiling threshold', () =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            mockServer.use(
                http.get(FIAT_ORDERS_URL, () =>
                    HttpResponse.json(EMPTY_FIAT_RESPONSE, { headers: { [USED_WEIGHT_HEADER]: NEAR_CEILING_UID_WEIGHT } })
                )
            );

            const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
            const coolDownDelays = yield* withCoolDownSpy(
                COOL_DOWN_WINDOW_MS,
                client.getTransactions('SPOT:EUR', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO)
            );

            expect(coolDownDelays).toContain(COOL_DOWN_WINDOW_MS);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('binance/per-run-cache', () => {
    it.effect('serves the second asset in the same wallet from the cached window without re-fetching', () =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            mockServer.use(
                http.get(
                    DEPOSIT_URL,
                    () =>
                        HttpResponse.json([
                            buildBinance.deposit({ id: 'dep-btc', coin: 'BTC', amount: '1' }),
                            buildBinance.deposit({ id: 'dep-eth', coin: 'ETH', amount: '2' })
                        ]),
                    { once: true }
                )
            );

            const client = new BinanceSignedClient(BINANCE_TEST_TOKEN);
            const btcTransactions = yield* client.getTransactions('SPOT:BTC', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO);
            const ethTransactions = yield* client.getTransactions('SPOT:ETH', BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO);

            expect(btcTransactions.map(transaction => transaction.id)).toEqual(['dep-btc']);
            expect(ethTransactions.map(transaction => transaction.id)).toEqual(['dep-eth']);
        }).pipe(Effect.provide(TestLayer))
    );
});
