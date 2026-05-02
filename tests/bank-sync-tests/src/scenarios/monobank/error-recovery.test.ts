import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { http, HttpResponse } from 'msw';

import { BankSyncEntityTable } from '@budgie/contracts';

import { setupMonobankFixture, setupScenario, testDb } from '../../harness';
import { monobankServer } from '../../harness/monobank-server';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

setupScenario();

const SYNC_ERROR_THRESHOLD = 3;

describe('monobank/error-recovery', () => {
    const cases = [
        { label: '401 unauthorized', status: 401 },
        { label: '429 rate limited', status: 429 }
    ];

    for (const { label, status } of cases) {
        it(`marks the sync FAILED + disabled after ${SYNC_ERROR_THRESHOLD} consecutive ${label} errors`, async () => {
            const { bankSync } = setupMonobankFixture();
            monobankServer.use(
                http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => new HttpResponse(null, { status }))
            );

            await monobankSyncService.sync();

            const finalSync = testDb.select().from(BankSyncEntityTable).where(eq(BankSyncEntityTable.id, bankSync.id)).all()[0];
            expect(finalSync.errorCount).toBeGreaterThanOrEqual(SYNC_ERROR_THRESHOLD);
            expect(finalSync.enabled).toBe(false);
            expect(finalSync.status).toBe('FAILED');
            expect(finalSync.lastError).not.toBeNull();
        });
    }
});
