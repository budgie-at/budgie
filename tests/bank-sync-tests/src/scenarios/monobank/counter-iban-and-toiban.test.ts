import { describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';

import { TransactionEntryEntityTable } from '@budgie/contracts';

import { buildMonobankTx } from '../../harness/monobank-fixtures';
import { stubStatement } from '../../harness/monobank-server';
import { setupMonobankFixture } from '../../harness/setup-monobank-fixture';
import { setupScenario } from '../../harness/setup-scenario';
import { testDb } from '../../harness/setup';

import { monobankSyncService } from '@app/sync/service/monobank-sync.service';

setupScenario();

describe('monobank/counter-iban-and-toiban', () => {
    it('persists counterIban from the API into transaction_entries.toIban', async () => {
        const counterIban = 'UA213223130000026007233566001';

        setupMonobankFixture();
        stubStatement([buildMonobankTx({ id: 'tx-with-iban', amount: -100000, hold: false, counterIban })]);

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
        stubStatement([buildMonobankTx({ id: 'tx-no-iban', amount: -100000, hold: false })]);

        await monobankSyncService.sync();

        const entry = testDb
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.externalId, 'tx-no-iban'))
            .all()[0];
        expect(entry.toIban).toBeNull();
    });
});
