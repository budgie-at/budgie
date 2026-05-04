import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { TransactionEntryEntityTable } from '@budgie/contracts';

import { buildMonobank, monobankStub, setupMonobankFixture, testDb } from '../../harness';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

describe('monobank/counter-iban-and-toiban', () => {
    it('persists counterIban from the API into transaction_entries.toIban', async () => {
        const counterIban = 'UA213223130000026007233566001';

        setupMonobankFixture();
        monobankStub.statement([buildMonobank.transaction({ id: 'tx-with-iban', amount: -100000, hold: false, counterIban })]);

        await monobankSyncService.sync();

        const entry = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-with-iban'))
            .all()[0];
        expect(entry.toIban).toBe(counterIban);
    });

    it('leaves toIban null when monobank omits counterIban', async () => {
        setupMonobankFixture();
        monobankStub.statement([buildMonobank.transaction({ id: 'tx-no-iban', amount: -100000, hold: false })]);

        await monobankSyncService.sync();

        const entry = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-no-iban'))
            .all()[0];
        expect(entry.toIban).toBeNull();
    });
});
