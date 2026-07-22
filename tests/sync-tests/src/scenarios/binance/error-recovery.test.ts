import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncModeEnum } from '@budgie/contracts';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { DEPOSIT_URL, expectSyncFailedAndDisabled, fetchSyncById, setupBinanceFixture } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const RETRY_EXHAUSTION_TIMEOUT_MS = 30000;

describe('binance/error-recovery', () => {
    it('immediately disables a sync after an unauthorized Binance response', async () => {
        const { sync } = setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
        mockServer.use(http.get(DEPOSIT_URL, () => new HttpResponse(null, { status: 401 })));

        await binanceSyncService.sync();

        expectSyncFailedAndDisabled(sync.id, 0);
    });

    it(
        'immediately disables a sync after a malformed Binance response',
        async () => {
            const { sync } = setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
            mockServer.use(http.get(DEPOSIT_URL, () => HttpResponse.json({ unexpected: true })));

            await binanceSyncService.sync();

            expectSyncFailedAndDisabled(sync.id, 0);
            expect(fetchSyncById(sync.id).forwardSyncedAt).toBeNull();
        },
        RETRY_EXHAUSTION_TIMEOUT_MS
    );
});
