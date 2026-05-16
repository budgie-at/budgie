import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { BankSyncEntityTable, BankSyncModeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { fetchBankSyncById, fetchPersistedMonobankTransactions, setupMonobankFixture, testDb } from '../../harness';
import { monobankServer } from '../../harness/monobank/monobank-server';

const SWEEP_START = new Date('2026-05-16T00:00:00Z');
const FIXTURE_FORWARD_FROM = new Date('2026-01-01T00:00:00Z');
const EXPECTED_DORMANCY_FLOOR_REQUESTS = 6;

describe('monobank/empty-account-safety-net', () => {
    it('terminates backward sweep after ~6 empty 31-day windows (now - 6 months) when the account has no transactions', async () => {
        const { bankSync } = setupMonobankFixture('mono-acc-1', BankSyncModeEnum.BACKWARD, FIXTURE_FORWARD_FROM);

        testDb
            .update(BankSyncEntityTable)
            .set({ backwardSyncFromAt: SWEEP_START, backwardSyncedAt: null, forwardSyncedAt: new Date() })
            .where(eq(BankSyncEntityTable.id, bankSync.id))
            .run();

        let monobankRequestCount = 0;
        monobankServer.use(
            http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => {
                monobankRequestCount += 1;

                return HttpResponse.json([]);
            })
        );

        await monobankSyncService.sync();

        expect(monobankRequestCount).toBe(EXPECTED_DORMANCY_FLOOR_REQUESTS);
        expect(fetchPersistedMonobankTransactions()).toHaveLength(0);

        const finalSync = fetchBankSyncById(bankSync.id);
        expect(finalSync.mode).toBe(BankSyncModeEnum.FORWARD);
        expect(finalSync.transactionCount).toBe(0);
    });
});
