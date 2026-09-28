import { describe, expect, it } from 'vitest';

import { applyMigration, seed, testDb } from '../../harness';

const MIGRATION_FILE_NAME = '0069_repair_orphaned_consolidation_children.sql';
const DELETED_AT = 1_780_342_675;

const fetchSnapshot = async () => ({
    transactions: await testDb.$client.getAllAsync<{ id: number; deletedAt: number | null }>(
        'SELECT id, deleted_at AS deletedAt FROM transactions ORDER BY id'
    ),
    ledger: await testDb.$client.getAllAsync<{ accountId: number; balance: number }>(
        `SELECT entry.account_id AS accountId, SUM(CASE WHEN entry.type = 'DEBIT' THEN entry.amount ELSE -entry.amount END) AS balance
         FROM transaction_entries entry INNER JOIN transactions tx ON tx.id = entry.transaction_id
         WHERE entry.deleted_at IS NULL AND entry.original_transaction_id IS NULL AND tx.deleted_at IS NULL
         GROUP BY entry.account_id ORDER BY entry.account_id`
    ),
    debtEventEntryIds: await testDb.$client.getAllAsync<{ transactionEntryId: number | null }>(
        'SELECT transaction_entry_id AS transactionEntryId FROM debt_events ORDER BY id'
    ),
    foreignKeyViolations: await testDb.$client.getAllAsync('PRAGMA foreign_key_check')
});

describe('database/orphaned-consolidation-children-repair-migration', () => {
    it('retires ledger-less children and entry-less shells, clears FK orphans, keeps balances and is idempotent', async () => {
        const account = seed.account({ title: 'Synthetic card' });
        const otherAccount = seed.account({ title: 'Synthetic savings' });
        const debtAccount = seed.account({ title: 'Synthetic debt' });

        await testDb.$client.execAsync(`
            PRAGMA foreign_keys = OFF;
            INSERT INTO transactions (id, type, title, exchange_rate, from_account_id, to_account_id, consolidation_type, deleted_at)
            VALUES (1, 'TRANSFER', 'Deleted canonical', 1, ${account.id}, ${otherAccount.id}, 'TRANSFER_PAIR', ${DELETED_AT}),
                   (2, 'EXPENSE', 'Orphaned child', 1, ${account.id}, NULL, NULL, NULL),
                   (3, 'TRANSFER', 'Archived shell', 1, ${account.id}, ${otherAccount.id}, NULL, NULL),
                   (4, 'EXPENSE', 'Live expense', 1, ${account.id}, NULL, NULL, NULL);
            UPDATE transactions SET consolidation_parent_transaction_id = 1 WHERE id = 2;
            INSERT INTO transaction_entries (id, type, account_id, transaction_id, original_transaction_id, amount, deleted_at)
            VALUES (1, 'CREDIT', ${account.id}, 1, 2, 5000000, ${DELETED_AT}),
                   (2, 'CREDIT', ${account.id}, 3, NULL, 7000000, ${DELETED_AT}),
                   (3, 'DEBIT', ${otherAccount.id}, 3, NULL, 7000000, ${DELETED_AT}),
                   (4, 'CREDIT', ${account.id}, 4, NULL, 3000000, NULL);
            INSERT INTO tags (id, title) VALUES (1, 'Synthetic tag');
            INSERT INTO transaction_tags (transaction_id, tag_id) VALUES (4, 1), (999, 1);
            INSERT INTO debt_events (debt_account_id, transaction_id, transaction_entry_id, direction, source, amount)
            VALUES (${debtAccount.id}, 4, 998, 'CLOSE', 'INCOME_ATTACHMENT', 3000000);
            INSERT INTO bank_syncs (account_id, provider) VALUES (997, 'ERSTE');
            PRAGMA foreign_keys = ON;
        `);
        const before = await fetchSnapshot();

        await applyMigration(MIGRATION_FILE_NAME);
        const firstRun = await fetchSnapshot();
        await applyMigration(MIGRATION_FILE_NAME);

        expect(firstRun.transactions).toEqual([
            { id: 1, deletedAt: DELETED_AT },
            { id: 2, deletedAt: DELETED_AT },
            { id: 3, deletedAt: expect.any(Number) },
            { id: 4, deletedAt: null }
        ]);
        expect(firstRun.ledger).toEqual(before.ledger);
        expect(firstRun.debtEventEntryIds).toEqual([{ transactionEntryId: 4 }]);
        expect(before.foreignKeyViolations).toHaveLength(3);
        expect(firstRun.foreignKeyViolations).toEqual([]);
        expect(await fetchSnapshot()).toEqual(firstRun);
    });
});
