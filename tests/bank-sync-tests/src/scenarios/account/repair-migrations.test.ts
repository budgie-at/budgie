import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { testDb } from '../../harness';

const applyMigration = async (fileName: string): Promise<void> => {
    const sqlText = readFileSync(resolve(process.cwd(), '../../packages/app/drizzle', fileName), 'utf8');

    for (const statement of sqlText.split('--> statement-breakpoint')) {
        await testDb.$client.execAsync(statement);
    }
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
