import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncModeEnum } from '@budgie/contracts';
import { HttpResponse, http } from 'msw';
import { describe, it } from 'vitest';

import { DEPOSIT_URL, SYNC_ERROR_THRESHOLD, expectSyncFailedAndDisabled, httpFailureCases, setupBinanceFixture } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const RETRY_EXHAUSTION_TIMEOUT_MS = 30000;

describe('binance/error-recovery', () => {
    for (const { label, status } of httpFailureCases) {
        it(
            `marks the sync FAILED + disabled after ${SYNC_ERROR_THRESHOLD} consecutive ${label} errors`,
            async () => {
                const { sync } = setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
                mockServer.use(http.get(DEPOSIT_URL, () => new HttpResponse(null, { status })));

                await binanceSyncService.sync();

                expectSyncFailedAndDisabled(sync.id);
            },
            RETRY_EXHAUSTION_TIMEOUT_MS
        );
    }
});
