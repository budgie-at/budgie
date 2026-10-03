import { SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { HttpResponse, http } from 'msw';

import {
    DEPOSIT_URL,
    binanceStub,
    buildBinance,
    expectSyncFailedAndDisabled,
    fetchSyncById,
    setupBinanceFixture,
    TestLayer
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const RETRY_EXHAUSTION_TIMEOUT_MS = 30000;
const HTTP_BAD_REQUEST_STATUS = 400;
const ILLEGAL_PARAMETER_ERROR = { code: -1100, msg: 'Illegal characters found in parameter.' };

const expectSyncFailedAndEnabled = (syncId: number) =>
    Effect.gen(function* () {
        const sync = yield* fetchSyncById(syncId);

        expect(sync).toMatchObject({
            enabled: true,
            status: SyncStatusEnum.FAILED
        });
        expect(sync.lastError).not.toBeNull();
    });

const setupBtcAndEthFixtures = (depositResponse: () => Response) =>
    Effect.gen(function* () {
        const btcFixture = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.FORWARD });
        const ethFixture = yield* setupBinanceFixture({ asset: 'ETH', mode: SyncModeEnum.FORWARD });
        mockServer.use(http.get(DEPOSIT_URL, depositResponse));

        return { btcFixture, ethFixture };
    });

const setupForwardSyncWithDepositResponse = (respond: () => Response) =>
    Effect.gen(function* () {
        const { sync } = yield* setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
        mockServer.use(http.get(DEPOSIT_URL, respond));

        return sync;
    });

describe('binance/error-recovery', () => {
    it.effect('immediately disables a sync after an unauthorized Binance response', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const sync = yield* setupForwardSyncWithDepositResponse(() => new HttpResponse(null, { status: 401 }));

            yield* binanceSyncService.sync();

            yield* expectSyncFailedAndDisabled(sync.id, 0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('disables every Binance asset sync row in the same credential group after an unauthorized response', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const { btcFixture, ethFixture } = yield* setupBtcAndEthFixtures(() => new HttpResponse(null, { status: 401 }));

            yield* binanceSyncService.sync();

            yield* expectSyncFailedAndDisabled(btcFixture.sync.id, 0);
            yield* expectSyncFailedAndDisabled(ethFixture.sync.id, 0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect(
        'keeps a sync enabled after a malformed Binance source response',
        () =>
            Effect.gen(function* () {
                const binanceSyncService = yield* BinanceSyncService;

                const sync = yield* setupForwardSyncWithDepositResponse(() => HttpResponse.json({ unexpected: true }));

                yield* binanceSyncService.sync();

                yield* expectSyncFailedAndEnabled(sync.id);
                expect((yield* fetchSyncById(sync.id)).forwardSyncedAt).toBeNull();
            }).pipe(Effect.provide(TestLayer)),
        RETRY_EXHAUSTION_TIMEOUT_MS
    );

    it.effect(
        'keeps every Binance asset sync row enabled after a generic provider source error',
        () =>
            Effect.gen(function* () {
                const binanceSyncService = yield* BinanceSyncService;

                const { btcFixture, ethFixture } = yield* setupBtcAndEthFixtures(() => HttpResponse.json({ unexpected: true }));

                yield* binanceSyncService.sync();

                yield* expectSyncFailedAndEnabled(btcFixture.sync.id);
                yield* expectSyncFailedAndEnabled(ethFixture.sync.id);
            }).pipe(Effect.provide(TestLayer)),
        RETRY_EXHAUSTION_TIMEOUT_MS
    );

    it.effect(
        'disables only the failed Binance asset sync row after an account-specific invalid transfer response',
        () =>
            Effect.gen(function* () {
                const binanceSyncService = yield* BinanceSyncService;

                const usdtFixture = yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
                const ethFixture = yield* setupBinanceFixture({ asset: 'ETH', mode: SyncModeEnum.FORWARD });
                binanceStub.spotBalances([
                    buildBinance.balance({ asset: 'USDT', free: '100' }),
                    buildBinance.balance({ asset: 'ADA', free: '200' })
                ]);
                binanceStub.exchangeInfo(['ADAUSDT']);
                binanceStub.myTradesFailure(HTTP_BAD_REQUEST_STATUS, ILLEGAL_PARAMETER_ERROR);

                yield* binanceSyncService.sync();

                yield* expectSyncFailedAndDisabled(usdtFixture.sync.id, 0);
                expect(yield* fetchSyncById(ethFixture.sync.id)).toMatchObject({
                    enabled: true,
                    status: SyncStatusEnum.SYNCING,
                    lastError: null
                });
            }).pipe(Effect.provide(TestLayer)),
        RETRY_EXHAUSTION_TIMEOUT_MS
    );
});
