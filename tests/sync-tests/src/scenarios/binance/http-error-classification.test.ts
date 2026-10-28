import { SyncModeEnum } from '@budgie/contracts';
import { BinanceSignedClient, BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';

import {
    BINANCE_TEST_TOKEN,
    BINANCE_WINDOW_FROM,
    BINANCE_WINDOW_TO,
    DEPOSIT_URL,
    buildBinance,
    expectSyncFailedAndDisabled,
    fetchSyncById,
    setupBinanceFixture,
    stubEmptyBinanceSources,
    TestLayer
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

import type { JsonBodyType } from 'msw';

const SERVER_TIME_URL = 'https://api.binance.com/api/v3/time';
const RETRY_AFTER_SECONDS = 120;
const RETRY_AFTER_MS = 120_000;
const RUN_DEADLINE_MS = 30_000;
const NEARBY_DEADLINE_MS = 10_000;

const errorBody = (code: number, msg: string) => ({ code, msg });

const respondWith = (status: number, body: JsonBodyType, headers: Record<string, string> = {}) =>
    HttpResponse.json(body, { status, headers });

const countDepositRequests = (respond: () => Response) => {
    const requests: string[] = [];
    mockServer.use(
        http.get(DEPOSIT_URL, () => {
            requests.push('deposit');

            return respond();
        })
    );

    return requests;
};

const setupGroupedForwardSyncs = () =>
    Effect.gen(function* () {
        const btcFixture = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.FORWARD });
        const ethFixture = yield* setupBinanceFixture({ asset: 'ETH', mode: SyncModeEnum.FORWARD });

        return { btcFixture, ethFixture };
    });

const flipCapitalFailure = (client: BinanceSignedClient) =>
    Effect.flip(client.getCapitalTransactions(BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO));

describe('binance/http-error-classification', () => {
    it.effect('keeps every sync enabled after a 403 WAF block without a Binance auth code', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { btcFixture, ethFixture } = yield* setupGroupedForwardSyncs();
            countDepositRequests(() => new HttpResponse('<html>Forbidden</html>', { status: 403 }));

            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS);

            expect((yield* fetchSyncById(btcFixture.sync.id)).enabled).toBe(true);
            expect((yield* fetchSyncById(ethFixture.sync.id)).enabled).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('backs off a 418 IP ban with the Retry-After time instead of retrying', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { sync } = yield* setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
            const requests = countDepositRequests(() =>
                respondWith(418, errorBody(-1003, 'Way too many requests; IP banned.'), { 'retry-after': String(RETRY_AFTER_SECONDS) })
            );

            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS);

            expect(requests).toHaveLength(1);
            expect((yield* fetchSyncById(sync.id)).enabled).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('exposes the Retry-After time on a 418 rate-limited error', () =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            countDepositRequests(() => respondWith(418, errorBody(-1003, 'banned'), { 'retry-after': String(RETRY_AFTER_SECONDS) }));

            const error = yield* flipCapitalFailure(new BinanceSignedClient(BINANCE_TEST_TOKEN));

            expect(error).toMatchObject({ _tag: 'SyncRateLimitedError', retryAfterMs: RETRY_AFTER_MS });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('cools the throttle down for the Retry-After time after a 429', () =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            const requests = countDepositRequests(() => respondWith(429, errorBody(-1003, 'Too many requests'), { 'retry-after': '60' }));

            const client = new BinanceSignedClient(BINANCE_TEST_TOKEN, Date.now() + NEARBY_DEADLINE_MS);
            const firstError = yield* flipCapitalFailure(client);
            const secondError = yield* flipCapitalFailure(client);

            expect(firstError).toMatchObject({ _tag: 'SyncRateLimitedError', retryAfterMs: 60_000 });
            expect(secondError._tag).toBe('SyncDeferredError');
            expect(requests).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('maps a 451 region block to a terminal region-unavailable error', () =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            const requests = countDepositRequests(() => new HttpResponse(null, { status: 451 }));

            const error = yield* flipCapitalFailure(new BinanceSignedClient(BINANCE_TEST_TOKEN));

            expect(error._tag).toBe('SyncRegionUnavailableError');
            expect(requests).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not retry or treat a 451 region block as a bad key', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { btcFixture, ethFixture } = yield* setupGroupedForwardSyncs();
            const requests = countDepositRequests(() => new HttpResponse(null, { status: 451 }));

            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS);

            expect(requests).toHaveLength(1);
            expect((yield* fetchSyncById(btcFixture.sync.id)).enabled).toBe(false);
            expect((yield* fetchSyncById(ethFixture.sync.id)).enabled).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('disables every sync in the credential group after a -1022 bad signature', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { btcFixture, ethFixture } = yield* setupGroupedForwardSyncs();
            countDepositRequests(() => respondWith(400, errorBody(-1022, 'Signature for this request is not valid.')));

            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS);

            yield* expectSyncFailedAndDisabled(btcFixture.sync.id, 0);
            yield* expectSyncFailedAndDisabled(ethFixture.sync.id, 0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([-2014, -2008])('maps Binance auth code %i to an unauthorized error', code =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            countDepositRequests(() => respondWith(400, errorBody(code, 'API-key format invalid.')));

            const error = yield* flipCapitalFailure(new BinanceSignedClient(BINANCE_TEST_TOKEN));

            expect(error._tag).toBe('SyncUnauthorizedError');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('refreshes the server-time offset and retries once after a -1021 timestamp error', () =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            const timeRequests: string[] = [];
            mockServer.use(
                http.get(SERVER_TIME_URL, () => {
                    timeRequests.push('time');

                    return HttpResponse.json({ serverTime: Date.now() });
                })
            );
            const depositRequests: string[] = [];
            mockServer.use(
                http.get(DEPOSIT_URL, () => {
                    depositRequests.push('deposit');

                    return depositRequests.length === 1
                        ? respondWith(400, errorBody(-1021, 'Timestamp for this request is outside of the recvWindow.'))
                        : HttpResponse.json([buildBinance.deposit({ id: 'dep-1', coin: 'BTC', amount: '1' })]);
                })
            );

            const transactions = yield* new BinanceSignedClient(BINANCE_TEST_TOKEN).getCapitalTransactions(
                BINANCE_WINDOW_FROM,
                BINANCE_WINDOW_TO
            );

            expect(transactions.map(transaction => transaction.id)).toContain('dep-1');
            expect(timeRequests).toHaveLength(2);
            expect(depositRequests).toHaveLength(2);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('retries a failed server-time fetch on the next signed request instead of fixing the offset at zero', () =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            const timeRequests: string[] = [];
            mockServer.use(
                http.get(SERVER_TIME_URL, () => {
                    timeRequests.push('time');

                    return timeRequests.length === 1
                        ? respondWith(400, errorBody(-1100, 'bad'))
                        : HttpResponse.json({ serverTime: Date.now() });
                })
            );

            yield* new BinanceSignedClient(BINANCE_TEST_TOKEN).getCapitalTransactions(BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO);

            expect(timeRequests).toHaveLength(2);
        }).pipe(Effect.provide(TestLayer))
    );
});
