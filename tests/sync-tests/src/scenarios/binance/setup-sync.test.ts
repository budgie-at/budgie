import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import { BINANCE_TEST_TOKEN, binanceStub, buildBinance, seedCryptoInstrument, TestLayer } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const SYNC_ONLY_PATH = '/sapi/v1/c2c/orderMatch/listUserOrderHistory';

const stubSelectedBtcAccount = () =>
    Effect.gen(function* () {
        yield* seedCryptoInstrument('BTC');
        binanceStub.serverTime();
        binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' })]);
        binanceStub.fundingBalances([]);
        binanceStub.earnPositions([]);
        binanceStub.lockedEarnPositions([]);
    });

describe('binance/setup-sync', () => {
    it.effect('starts Binance sync after setting up selected accounts', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* stubSelectedBtcAccount();

            const requestedPaths: string[] = [];
            mockServer.events.on('request:start', ({ request }) => {
                requestedPaths.push(new URL(request.url).pathname);
            });

            yield* Effect.addFinalizer(() => Effect.sync(() => void mockServer.events.removeAllListeners()));

            yield* binanceSyncService.setupAccountSyncBatch(BINANCE_TEST_TOKEN, ['SPOT:BTC']);

            yield* Effect.promise(() =>
                vi.waitFor(() => {
                    expect(requestedPaths).toContain(SYNC_ONLY_PATH);
                })
            );
        }).pipe(Effect.provide(TestLayer))
    );
});
