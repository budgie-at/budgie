import { AccountDebtTypeEnum, AccountTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { applyMigration, seed, testDb } from '../../harness';

const MIGRATION_FILE_NAME = '0063_round_debt_event_micro_units.sql';
const SEEDED_AT = 1_700_000_000;

const fetchSnapshot = async (debtAccountId: number) => ({
    fractionalCount: (
        await testDb.$client.getFirstAsync<{ count: number }>(
            "SELECT count(*) AS count FROM debt_events WHERE typeof(amount) = 'real' OR typeof(base_amount) = 'real'"
        )
    )?.count,
    events: await testDb.$client.getAllAsync<{ amount: number; baseAmount: number | null; updatedAt: number }>(
        'SELECT amount, base_amount AS baseAmount, updated_at AS updatedAt FROM debt_events ORDER BY id'
    ),
    balance: await testDb.$client.getFirstAsync<{ amount: number; type: string; updatedAt: number }>(
        `SELECT amount, typeof(amount) AS type, updated_at AS updatedAt FROM account_balances WHERE account_id = ${debtAccountId}`
    )
});

describe('debt/debt-event-integer-micro-units-migration', () => {
    it('rounds fractional debt events and the debt balance once and is a no-op on the second run', async () => {
        const debtAccount = seed.account({ title: 'Synthetic debt', type: AccountTypeEnum.DEBT, debtType: AccountDebtTypeEnum.LENT });

        await testDb.$client.execAsync(`
            INSERT INTO debt_events (created_at, updated_at, debt_account_id, direction, source, operated_at, amount, base_amount)
            VALUES
                (${SEEDED_AT}, ${SEEDED_AT}, ${debtAccount.id}, 'OPEN', 'TRANSFER', ${SEEDED_AT}, 33333333.4, 38813881.6),
                (${SEEDED_AT}, ${SEEDED_AT}, ${debtAccount.id}, 'CLOSE', 'TRANSFER', ${SEEDED_AT}, 1000000.5, NULL);
            INSERT INTO account_balances (created_at, updated_at, account_id, amount)
            VALUES (${SEEDED_AT}, ${SEEDED_AT}, ${debtAccount.id}, 32333332.9);
        `);

        await applyMigration(MIGRATION_FILE_NAME);
        const firstRun = await fetchSnapshot(debtAccount.id);
        await applyMigration(MIGRATION_FILE_NAME);

        expect(firstRun.fractionalCount).toBe(0);
        expect(firstRun.events.map(({ amount, baseAmount }) => [amount, baseAmount])).toEqual([
            [33_333_333, 38_813_882],
            [1_000_001, null]
        ]);
        expect(firstRun.balance).toMatchObject({ amount: 32_333_332, type: 'integer' });
        expect(await fetchSnapshot(debtAccount.id)).toEqual(firstRun);
    });
});
