import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { BankSyncModeEnum } from '@budgie/contracts';
import { HttpResponse, http } from 'msw';
import { describe, it } from 'vitest';

import { DEPOSIT_URL, SYNC_ERROR_THRESHOLD, expectSyncFailedAndDisabled, httpFailureCases, setupBinanceFixture } from '../../harness';
import { binanceServer } from '../../harness/binance/binance-server';

const RETRY_EXHAUSTION_TIMEOUT_MS = 30000;

describe('binance/error-recovery', () => {
    for (const { label, status } of httpFailureCases) {
        it(
            `marks the sync FAILED + disabled after ${SYNC_ERROR_THRESHOLD} consecutive ${label} errors`,
            async () => {
                const { bankSync } = setupBinanceFixture({ mode: BankSyncModeEnum.FORWARD });
                binanceServer.use(http.get(DEPOSIT_URL, () => new HttpResponse(null, { status })));

                await binanceSyncService.sync();

                expectSyncFailedAndDisabled(bankSync.id);
            },
            RETRY_EXHAUSTION_TIMEOUT_MS
        );
    }
});
