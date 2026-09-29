import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import * as Effect from 'effect/Effect';
import { describe, expect, it, vi } from 'vitest';

import { BINANCE_TEST_TOKEN, binanceStub, buildBinance, seedCryptoInstrument, run } from '../../harness';

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
    it('starts Binance sync after setting up selected accounts', async () => {
        stubSelectedBtcAccount();

        const registerBackgroundTaskSpy = vi.spyOn(binanceSyncService, 'registerBackgroundTask').mockReturnValue(Effect.void);
        const syncSpy = vi.spyOn(binanceSyncService, 'sync').mockReturnValue(Effect.succeed(BACKGROUND_TASK_SUCCESS_RESULT));

        try {
            await run(binanceSyncService.setupAccountSyncBatch(BINANCE_TEST_TOKEN, ['SPOT:BTC']));

            expect(registerBackgroundTaskSpy).toHaveBeenCalledTimes(1);
            await vi.waitFor(() => {
                expect(syncSpy).toHaveBeenCalledTimes(1);
            });
        } finally {
            registerBackgroundTaskSpy.mockRestore();
            syncSpy.mockRestore();
        }
    });
});
