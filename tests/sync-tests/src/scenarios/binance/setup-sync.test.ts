import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { BINANCE_TEST_TOKEN, binanceStub, buildBinance, seedCryptoInstrument, TestLayer } from '../../harness';

const BACKGROUND_TASK_SUCCESS_RESULT = 1;

const stubSelectedBtcAccount = (): void => {
    seedCryptoInstrument('BTC');
    binanceStub.serverTime();
    binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' })]);
    binanceStub.fundingBalances([]);
    binanceStub.earnPositions([]);
    binanceStub.lockedEarnPositions([]);
};

describe('binance/setup-sync', () => {
    it.effect('starts Binance sync after setting up selected accounts', () =>
        Effect.gen(function* () {
            stubSelectedBtcAccount();

            const registerBackgroundTaskSpy = vi.spyOn(binanceSyncService, 'registerBackgroundTask').mockReturnValue(Effect.void);
            const syncSpy = vi.spyOn(binanceSyncService, 'sync').mockReturnValue(Effect.succeed(BACKGROUND_TASK_SUCCESS_RESULT));

            yield* Effect.addFinalizer(() =>
                Effect.sync(() => {
                    registerBackgroundTaskSpy.mockRestore();
                    syncSpy.mockRestore();
                })
            );

            yield* binanceSyncService.setupAccountSyncBatch(BINANCE_TEST_TOKEN, ['SPOT:BTC']);

            expect(registerBackgroundTaskSpy).toHaveBeenCalledTimes(1);
            yield* Effect.promise(() =>
                vi.waitFor(() => {
                    expect(syncSpy).toHaveBeenCalledTimes(1);
                })
            );
        }).pipe(Effect.provide(TestLayer))
    );
});
