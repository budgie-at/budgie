import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { getDefined } from '@rnw-community/shared';

import { testDb } from '../../harness';

const OPENING_DEBT_AMOUNT = 1_500_000;

const applyMigration = async (fileName: string): Promise<void> => {
    const sqlText = readFileSync(resolve(process.cwd(), '../../packages/app/drizzle', fileName), 'utf8');

    await sqlText
        .split('--> statement-breakpoint')
        .reduce((migration, statement) => migration.then(() => testDb.$client.execAsync(statement)), Promise.resolve());
};

describe('account/repair-migrations', () => {
    it('rewrites legacy Privatbank IBANs to the schema-valid format', async () => {
        await testDb.$client.runAsync(
            `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance)
             VALUES ('Legacy Privatbank', 'legacy privatbank', 'BANK_SYNC', 'ASSET', 'Landmark', 1, 900, 'UA11111113126', 1, 1, 0)`
        );

        await applyMigration('0037_repair_invalid_account_ibans.sql');

        const row = await testDb.$client.getFirstAsync<{ iban: string | null }>(
            `SELECT iban FROM accounts WHERE title = 'Legacy Privatbank'`
        );

        expect(row?.iban).toBe('UA00PRIVATBANK3126');
    });

    it('nulls IBANs that cannot be repaired', async () => {
        await testDb.$client.runAsync(
            `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance)
             VALUES ('Empty Iban', 'empty iban', 'BANK_SYNC', 'ASSET', 'Landmark', 1, 901, '', 1, 1, 0),
                    ('Spaced Iban', 'spaced iban', 'BANK_SYNC', 'ASSET', 'Landmark', 1, 902, 'AT48 1200 0100', 1, 1, 0)`
        );

        await applyMigration('0037_repair_invalid_account_ibans.sql');

        const rows = await testDb.$client.getAllAsync<{ iban: string | null }>(
            `SELECT iban FROM accounts WHERE title IN ('Empty Iban', 'Spaced Iban')`
        );

        expect(rows.every(row => row.iban === null)).toBe(true);
    });

    it('canonicalizes lowercase and space-formatted IBANs instead of discarding them', async () => {
        await testDb.$client.runAsync(
            `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance)
             VALUES ('Lowercase Spaced Iban', 'lowercase spaced iban', 'BANK_SYNC', 'ASSET', 'Landmark', 1, 905, 'at48 1200 0100 1234 5678', 1, 1, 0),
                    ('Nbsp Iban', 'nbsp iban', 'BANK_SYNC', 'ASSET', 'Landmark', 1, 906, 'AT48' || char(160) || '1200010012345678', 1, 1, 0)`
        );

        await applyMigration('0037_repair_invalid_account_ibans.sql');

        const rows = await testDb.$client.getAllAsync<{ iban: string | null }>(
            `SELECT iban FROM accounts WHERE title IN ('Lowercase Spaced Iban', 'Nbsp Iban') ORDER BY "order"`
        );

        expect(rows.map(row => row.iban)).toStrictEqual(['AT481200010012345678', 'AT481200010012345678']);
    });

    it('keeps valid IBANs untouched', async () => {
        await testDb.$client.runAsync(
            `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance)
             VALUES ('Valid Iban', 'valid iban', 'BANK_SYNC', 'ASSET', 'Landmark', 1, 903, 'AT481200010012345678', 1, 1, 0)`
        );

        await applyMigration('0037_repair_invalid_account_ibans.sql');

        const row = await testDb.$client.getFirstAsync<{ iban: string | null }>(`SELECT iban FROM accounts WHERE title = 'Valid Iban'`);

        expect(row?.iban).toBe('AT481200010012345678');
    });

    it('renames removed icon enum members', async () => {
        await testDb.$client.runAsync(
            `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance)
             VALUES ('Stale Icon', 'stale icon', 'CASH', 'ASSET', 'AlarmCheck', 1, 904, NULL, 1, 1, 0)`
        );

        await applyMigration('0037_repair_invalid_account_ibans.sql');

        const row = await testDb.$client.getFirstAsync<{ icon: string }>(`SELECT icon FROM accounts WHERE title = 'Stale Icon'`);

        expect(row?.icon).toBe('AlarmClockCheck');
    });
});

describe('account/repair-zero-target-debt', () => {
    it('backfills target balance from the opening debt event', async () => {
        await testDb.$client.runAsync(
            `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance, debt_type)
             VALUES ('Zero Target Debt', 'zero target debt', 'DEBT', 'LIABILITY', 'Landmark', 1, 910, NULL, 1, 1, 0, 'BORROW')`
        );

        const account = await testDb.$client.getFirstAsync<{ id: number }>(`SELECT id FROM accounts WHERE title = 'Zero Target Debt'`);
        const accountId = getDefined(account?.id, () => {
            throw new Error('Zero Target Debt account was not inserted');
        });

        await testDb.$client.runAsync(
            `INSERT INTO debt_events (debt_account_id, transaction_id, transaction_entry_id, direction, source, operated_at, amount)
             VALUES (?, NULL, NULL, 'OPEN', 'INCOME_ATTACHMENT', 1780000000, ?)`,
            [accountId, OPENING_DEBT_AMOUNT]
        );

        await applyMigration('0038_repair_zero_target_debt_accounts.sql');

        const repaired = await testDb.$client.getFirstAsync<{ target_balance: number }>(
            `SELECT target_balance FROM accounts WHERE title = 'Zero Target Debt'`
        );

        expect(repaired?.target_balance).toBe(OPENING_DEBT_AMOUNT);
    });

    it('leaves debt accounts without an opening event untouched', async () => {
        await testDb.$client.runAsync(
            `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance, debt_type)
             VALUES ('Orphan Debt', 'orphan debt', 'DEBT', 'LIABILITY', 'Landmark', 1, 911, NULL, 1, 1, 0, 'BORROW')`
        );

        await applyMigration('0038_repair_zero_target_debt_accounts.sql');

        const row = await testDb.$client.getFirstAsync<{ target_balance: number }>(
            `SELECT target_balance FROM accounts WHERE title = 'Orphan Debt'`
        );

        expect(row?.target_balance).toBe(0);
    });
});
