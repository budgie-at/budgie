import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { TransactionEntityTable, TransactionEntryEntityTable } from '@budgie/contracts';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb } from '../../harness';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

describe('monobank/cross-currency-exchange-rate', () => {
    it('computes exchangeRate as amount/operationAmount when currencies differ', async () => {
        setupMonobankFixture();
        monobankStub.statement([
            buildMonobank.transaction({
                id: 'tx-fx',
                amount: -410000,
                operationAmount: -10000,
                hold: false,
                currencyCode: 840
            })
        ]);

        await monobankSyncService.sync();

        const transaction = testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, 'tx-fx')).all()[0];
        const entry = testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.externalId, 'tx-fx')).all()[0];

        expect(transaction.exchangeRate).toBe(41);
        expect(entry.exchangeRate).toBe(41);
    });

    it('keeps exchangeRate=1 when amount equals operationAmount', async () => {
        setupMonobankFixture();
        monobankStub.statement([
            buildMonobank.transaction({ id: 'tx-same-currency', amount: -10000, operationAmount: -10000, hold: false })
        ]);

        await monobankSyncService.sync();

        const transaction = testDb
            .select()
            .from(TransactionEntityTable)
            .where(eq(TransactionEntityTable.externalId, 'tx-same-currency'))
            .all()[0];
        expect(transaction.exchangeRate).toBe(1);
    });
});
