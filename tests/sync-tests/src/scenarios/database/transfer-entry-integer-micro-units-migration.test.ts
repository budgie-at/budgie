import { AccountTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { applyMigration, seed, testDb } from '../../harness';

const MIGRATION_FILE_NAME = '0064_round_transfer_micro_units.sql';
const SEEDED_AT = 1_700_000_000;

const fetchSnapshot = async (accountId: number) => ({
    fractionalCount: (
        await testDb.$client.getFirstAsync<{ count: number }>(
            `SELECT
                (SELECT count(*) FROM transaction_entries WHERE typeof(amount) = 'real' OR typeof(base_amount) = 'real' OR typeof(quoted_amount) = 'real' OR typeof(quoted_unit_price) = 'real')
                + (SELECT count(*) FROM account_balances WHERE typeof(amount) = 'real') AS count`
        )
    )?.count,
    entries: await testDb.$client.getAllAsync<{ amount: number; updatedAt: number }>(
        'SELECT amount, updated_at AS updatedAt FROM transaction_entries ORDER BY id'
    ),
    balance: await testDb.$client.getFirstAsync<{ amount: number; type: string; updatedAt: number }>(
        `SELECT amount, typeof(amount) AS type, updated_at AS updatedAt FROM account_balances WHERE account_id = ${accountId}`
    )
});

describe('debt/transfer-entry-integer-micro-units-migration', () => {
    it('rounds fractional transaction entries and the account balance once and is a no-op on the second run', async () => {
        const account = seed.account({ title: 'Synthetic euro card', type: AccountTypeEnum.BANK_SYNC });

        await testDb.$client.execAsync(`
            INSERT INTO transactions (created_at, updated_at, type, title, operated_at, exchange_rate)
            VALUES (${SEEDED_AT}, ${SEEDED_AT}, 'TRANSFER', 'Synthetic transfer', ${SEEDED_AT}, 3);

            INSERT INTO transaction_entries (created_at, updated_at, type, account_id, transaction_id, amount)
            VALUES (${SEEDED_AT}, ${SEEDED_AT}, 'CREDIT', ${account.id}, last_insert_rowid(), 33333333.4);

            INSERT INTO account_balances (created_at, updated_at, account_id, amount)
            VALUES (${SEEDED_AT}, ${SEEDED_AT}, ${account.id}, -33333333.4);
        `);

        await applyMigration(MIGRATION_FILE_NAME);
        const firstRun = await fetchSnapshot(account.id);
        await applyMigration(MIGRATION_FILE_NAME);

        expect(firstRun.fractionalCount).toBe(0);
        expect(firstRun.entries.map(({ amount }) => amount)).toEqual([33_333_333]);
        expect(firstRun.balance).toMatchObject({ amount: -33_333_333, type: 'integer' });
        expect(await fetchSnapshot(account.id)).toEqual(firstRun);
    });
});
