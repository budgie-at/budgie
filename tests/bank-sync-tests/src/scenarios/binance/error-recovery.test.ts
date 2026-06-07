import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { BankSyncEntityTable, BankSyncModeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { setupBinanceFixture, testDb } from '../../harness';
import { binanceServer } from '../../harness/binance/binance-server';

const DEPOSIT_URL = 'https://api.binance.com/sapi/v1/capital/deposit/hisrec';
const SYNC_ERROR_THRESHOLD = 3;
const RETRY_EXHAUSTION_TIMEOUT_MS = 30000;

describe('binance/error-recovery', () => {
    const cases = [
        { label: '401 unauthorized', status: 401 },
        { label: '429 rate limited', status: 429 }
    ];

    for (const { label, status } of cases) {
        it(
            `marks the sync FAILED + disabled after ${SYNC_ERROR_THRESHOLD} consecutive ${label} errors`,
            async () => {
                const { bankSync } = setupBinanceFixture({ mode: BankSyncModeEnum.FORWARD });
                binanceServer.use(http.get(DEPOSIT_URL, () => new HttpResponse(null, { status })));

                await binanceSyncService.sync();

                const finalSync = testDb.select().from(BankSyncEntityTable).where(eq(BankSyncEntityTable.id, bankSync.id)).all()[0];
                expect(finalSync.errorCount).toBeGreaterThanOrEqual(SYNC_ERROR_THRESHOLD);
                expect(finalSync.enabled).toBe(false);
                expect(finalSync.status).toBe('FAILED');
                expect(finalSync.lastError).not.toBeNull();
            },
            RETRY_EXHAUSTION_TIMEOUT_MS
        );
    }
});
