import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { BankSyncEntityTable, BankSyncModeEnum, ExternalSourceEnum, TransactionEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { buildMonobank, setupMonobankFixture, testDb } from '../../harness';
import { monobankServer } from '../../harness/monobank/monobank-server';

import type { MonobankTransactionApiInterface } from '@budgie/bank-sync';



const SWEEP_START = new Date('2026-05-16T00:00:00Z');
const FIXTURE_FORWARD_FROM = new Date('2026-01-01T00:00:00Z');
const SECONDS_PER_DAY = 86_400;
const MS_PER_SECOND = 1_000;
const OLD_TRANSACTION_AGE_DAYS = 80;
const OLD_TRANSACTION_AMOUNT_KOPECKS = -1234;
const EXPECTED_PERSISTED_COUNT = 1;

describe('monobank/old-transactions-after-dormant-month', () => {
    // eslint-disable-next-line max-statements -- Backward sweep scenario sets up fixture, 7 MSW handlers, request, and 6 assertions
    it('surfaces an old transaction sitting beyond two empty 31-day windows, then terminates via the safety net', async () => {
        const { bankSync } = setupMonobankFixture('mono-acc-1', BankSyncModeEnum.BACKWARD, FIXTURE_FORWARD_FROM);

        testDb
            .update(BankSyncEntityTable)
            .set({ backwardSyncFromAt: SWEEP_START, backwardSyncedAt: null })
            .where(eq(BankSyncEntityTable.id, bankSync.id))
            .run();

        const oldTransactionTimeSeconds = Math.floor(SWEEP_START.getTime() / MS_PER_SECOND) - OLD_TRANSACTION_AGE_DAYS * SECONDS_PER_DAY;
        const oldTransaction: MonobankTransactionApiInterface = buildMonobank.transaction({
            id: 'tx-old-80d',
            amount: OLD_TRANSACTION_AMOUNT_KOPECKS,
            hold: false,
            time: oldTransactionTimeSeconds
        });

        const responses: MonobankTransactionApiInterface[][] = [[], [], [oldTransaction], [], [], []];
        monobankServer.use(http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => HttpResponse.json([])));
        for (const batch of [...responses].reverse()) {
            monobankServer.use(
                http.get('https://api.monobank.ua/personal/statement/:account/:from/:to', () => HttpResponse.json(batch), { once: true })
            );
        }

        await monobankSyncService.sync();

        const persisted = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.MONOBANK))
            .all();
        expect(persisted).toHaveLength(EXPECTED_PERSISTED_COUNT);
        const [persistedOld] = persisted;
        expect(persistedOld.externalId).toBe('tx-old-80d');

        const [finalSync] = testDb.select().from(BankSyncEntityTable).where(eq(BankSyncEntityTable.id, bankSync.id)).all();
        expect(finalSync.mode).toBe(BankSyncModeEnum.FORWARD);
        expect(finalSync.transactionCount).toBe(EXPECTED_PERSISTED_COUNT);
    });
});
