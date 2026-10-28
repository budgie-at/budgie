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
const SPOT_BALANCE_URL = 'https://api.binance.com/sapi/v3/asset/getUserAsset';
const RETRY_AFTER_SECONDS = 120;
const RETRY_AFTER_MS = 120_000;
const RUN_DEADLINE_MS = 30_000;
const NEARBY_DEADLINE_MS = 10_000;

const errorBody = (code: number, msg: string) => ({ code, msg });

const respondWith = (status: number, body: JsonBodyType, headers: Record<string, string> = {}) =>
    HttpResponse.json(body, { status, headers });

const respondBanned = () =>
    respondWith(418, errorBody(-1003, 'Way too many requests; IP banned.'), { 'retry-after': String(RETRY_AFTER_SECONDS) });

const respondRegionBlocked = () => new HttpResponse(null, { status: 451 });

const countRequests = (method: 'get' | 'post', url: string, respond: (requestNumber: number) => Response) => {
    const requests: string[] = [];
    mockServer.use(
        http[method](url, () => {
            requests.push(url);

            return respond(requests.length);
        })
    );

    return requests;
};

const countDepositRequests = (respond: (requestNumber: number) => Response) => countRequests('get', DEPOSIT_URL, respond);

const flipCapitalFailure = (client: BinanceSignedClient) =>
    Effect.flip(client.getCapitalTransactions(BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO));

const BLOCKED_SYNC_CASES = [
    { label: '403 WAF block without an auth code', respond: () => new HttpResponse('<html>Forbidden</html>', { status: 403 }) },
    { label: '418 IP ban with Retry-After', respond: respondBanned },
    { label: '451 region block', respond: respondRegionBlocked }
];

const CLIENT_ERROR_CASES = [
    { label: '418 ban', respond: respondBanned, expected: { _tag: 'SyncRateLimitedError', retryAfterMs: RETRY_AFTER_MS } },
    { label: '451 region block', respond: respondRegionBlocked, expected: { _tag: 'SyncRegionUnavailableError' } },
    {
        label: 'code -2014',
        respond: () => respondWith(400, errorBody(-2014, 'API-key format invalid.')),
        expected: { _tag: 'SyncUnauthorizedError' }
    },
    {
        label: 'code -2008',
        respond: () => respondWith(400, errorBody(-2008, 'Invalid Api-Key ID.')),
        expected: { _tag: 'SyncUnauthorizedError' }
    }
];

describe('binance/http-error-classification', () => {
    it.effect.each(BLOCKED_SYNC_CASES)('keeps every sync enabled and sends one request after a $label', ({ respond }) =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const btcFixture = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.FORWARD });
            const ethFixture = yield* setupBinanceFixture({ asset: 'ETH', mode: SyncModeEnum.FORWARD });
            const requests = countDepositRequests(respond);

            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS);

            expect(requests).toHaveLength(1);
            expect((yield* fetchSyncById(btcFixture.sync.id)).enabled).toBe(true);
            expect((yield* fetchSyncById(ethFixture.sync.id)).enabled).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each(CLIENT_ERROR_CASES)('maps a $label to a typed error after one request', ({ respond, expected }) =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            const requests = countDepositRequests(respond);

            const error = yield* flipCapitalFailure(new BinanceSignedClient(BINANCE_TEST_TOKEN));

            expect(error).toMatchObject(expected);
            expect(requests).toHaveLength(1);
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

    it.effect('does not call Binance in a later run while a 418 Retry-After ban is active', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            yield* setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
            const depositRequests = countDepositRequests(respondBanned);
            const balanceRequests = countRequests('post', SPOT_BALANCE_URL, () => HttpResponse.json([]));

            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS);
            const requestsAfterBan = depositRequests.length + balanceRequests.length;
            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS);

            expect(depositRequests.length + balanceRequests.length).toBe(requestsAfterBan);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('disables every sync in the credential group after a -1022 bad signature', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const btcFixture = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.FORWARD });
            const ethFixture = yield* setupBinanceFixture({ asset: 'ETH', mode: SyncModeEnum.FORWARD });
            countDepositRequests(() => respondWith(400, errorBody(-1022, 'Signature for this request is not valid.')));

            yield* binanceSyncService.sync(Date.now() + RUN_DEADLINE_MS);

            yield* expectSyncFailedAndDisabled(btcFixture.sync.id, 0);
            yield* expectSyncFailedAndDisabled(ethFixture.sync.id, 0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('refreshes the server-time offset and retries once after a -1021 timestamp error', () =>
        Effect.gen(function* () {
            stubEmptyBinanceSources();
            const timeRequests = countRequests('get', SERVER_TIME_URL, () => HttpResponse.json({ serverTime: Date.now() }));
            const depositRequests = countDepositRequests(requestNumber =>
                requestNumber === 1
                    ? respondWith(400, errorBody(-1021, 'Timestamp for this request is outside of the recvWindow.'))
                    : HttpResponse.json([buildBinance.deposit({ id: 'dep-1', coin: 'BTC', amount: '1' })])
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
            const timeRequests = countRequests('get', SERVER_TIME_URL, requestNumber =>
                requestNumber === 1 ? respondWith(400, errorBody(-1100, 'bad')) : HttpResponse.json({ serverTime: Date.now() })
            );

            yield* new BinanceSignedClient(BINANCE_TEST_TOKEN).getCapitalTransactions(BINANCE_WINDOW_FROM, BINANCE_WINDOW_TO);

            expect(timeRequests).toHaveLength(2);
        }).pipe(Effect.provide(TestLayer))
    );
});
