import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { getDefined } from '@rnw-community/shared';

import { applyMigration, testDb, TestLayer } from '../../harness';

describe('account/repair-migrations', () => {
    it.effect('rewrites legacy Privatbank IBANs to the schema-valid format', () =>
        Effect.gen(function* () {
            yield* Effect.promise(() =>
                testDb.$client.runAsync(
                    `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance)
             VALUES ('Legacy Privatbank', 'legacy privatbank', 'BANK_SYNC', 'ASSET', 'Landmark', 1, 900, 'UA11111113126', 1, 1, 0)`
                )
            );

            yield* applyMigration('0037_repair_invalid_account_ibans.sql');

            const row = yield* Effect.promise(() =>
                testDb.$client.getFirstAsync<{ iban: string | null }>(`SELECT iban FROM accounts WHERE title = 'Legacy Privatbank'`)
            );

            expect(row?.iban).toBe('UA00PRIVATBANK3126');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('nulls IBANs that cannot be repaired', () =>
        Effect.gen(function* () {
            yield* Effect.promise(() =>
                testDb.$client.runAsync(
                    `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance)
             VALUES ('Empty Iban', 'empty iban', 'BANK_SYNC', 'ASSET', 'Landmark', 1, 901, '', 1, 1, 0),
                    ('Spaced Iban', 'spaced iban', 'BANK_SYNC', 'ASSET', 'Landmark', 1, 902, 'AT48 1200 0100', 1, 1, 0)`
                )
            );

            yield* applyMigration('0037_repair_invalid_account_ibans.sql');

            const rows = yield* Effect.promise(() =>
                testDb.$client.getAllAsync<{ iban: string | null }>(
                    `SELECT iban FROM accounts WHERE title IN ('Empty Iban', 'Spaced Iban')`
                )
            );

            expect(rows.every(row => row.iban === null)).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('canonicalizes lowercase and space-formatted IBANs instead of discarding them', () =>
        Effect.gen(function* () {
            yield* Effect.promise(() =>
                testDb.$client.runAsync(
                    `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance)
             VALUES ('Lowercase Spaced Iban', 'lowercase spaced iban', 'BANK_SYNC', 'ASSET', 'Landmark', 1, 905, 'at48 1200 0100 1234 5678', 1, 1, 0),
                    ('Nbsp Iban', 'nbsp iban', 'BANK_SYNC', 'ASSET', 'Landmark', 1, 906, 'AT48' || char(160) || '1200010012345678', 1, 1, 0)`
                )
            );

            yield* applyMigration('0037_repair_invalid_account_ibans.sql');

            const rows = yield* Effect.promise(() =>
                testDb.$client.getAllAsync<{ iban: string | null }>(
                    `SELECT iban FROM accounts WHERE title IN ('Lowercase Spaced Iban', 'Nbsp Iban') ORDER BY "order"`
                )
            );

            expect(rows.map(row => row.iban)).toStrictEqual(['AT481200010012345678', 'AT481200010012345678']);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps valid IBANs untouched', () =>
        Effect.gen(function* () {
            yield* Effect.promise(() =>
                testDb.$client.runAsync(
                    `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance)
             VALUES ('Valid Iban', 'valid iban', 'BANK_SYNC', 'ASSET', 'Landmark', 1, 903, 'AT481200010012345678', 1, 1, 0)`
                )
            );

            yield* applyMigration('0037_repair_invalid_account_ibans.sql');

            const row = yield* Effect.promise(() =>
                testDb.$client.getFirstAsync<{ iban: string | null }>(`SELECT iban FROM accounts WHERE title = 'Valid Iban'`)
            );

            expect(row?.iban).toBe('AT481200010012345678');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('renames removed icon enum members', () =>
        Effect.gen(function* () {
            yield* Effect.promise(() =>
                testDb.$client.runAsync(
                    `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance)
             VALUES ('Stale Icon', 'stale icon', 'CASH', 'ASSET', 'AlarmCheck', 1, 904, NULL, 1, 1, 0)`
                )
            );

            yield* applyMigration('0037_repair_invalid_account_ibans.sql');

            const row = yield* Effect.promise(() =>
                testDb.$client.getFirstAsync<{ icon: string }>(`SELECT icon FROM accounts WHERE title = 'Stale Icon'`)
            );

            expect(row?.icon).toBe('AlarmClockCheck');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('updates legacy default account icons without replacing custom choices', () =>
        Effect.gen(function* () {
            yield* Effect.promise(() =>
                testDb.$client.runAsync(
                    `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance)
             VALUES ('Default Cash Icon', 'default cash icon', 'CASH', 'ASSET', 'Wallet', 1, 920, NULL, 1, 1, 0),
                    ('Custom Cash Icon', 'custom cash icon', 'CASH', 'ASSET', 'Landmark', 1, 921, NULL, 1, 1, 0),
                    ('Default Savings Icon', 'default savings icon', 'SAVINGS', 'ASSET', 'Coins', 1, 922, NULL, 1, 1, 0),
                    ('Custom Savings Icon', 'custom savings icon', 'SAVINGS', 'ASSET', 'WalletCards', 1, 923, NULL, 1, 1, 0),
                    ('Default Deposit Icon', 'default deposit icon', 'DEPOSIT', 'ASSET', 'PiggyBank', 1, 924, NULL, 1, 1, 0),
                    ('Custom Deposit Icon', 'custom deposit icon', 'DEPOSIT', 'ASSET', 'Percent', 1, 925, NULL, 1, 1, 0)`
                )
            );

            yield* applyMigration('0043_update_default_account_icons.sql');
            yield* applyMigration('0043_update_default_account_icons.sql');

            const rows = yield* Effect.promise(() =>
                testDb.$client.getAllAsync<{ icon: string }>(
                    `SELECT icon FROM accounts WHERE title IN (
                'Default Cash Icon',
                'Custom Cash Icon',
                'Default Savings Icon',
                'Custom Savings Icon',
                'Default Deposit Icon',
                'Custom Deposit Icon'
            ) ORDER BY "order"`
                )
            );

            expect(rows.map(row => row.icon)).toStrictEqual(['PiggyBank', 'Landmark', 'PiggyBank', 'WalletCards', 'Landmark', 'Percent']);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('account/repair-zero-target-debt', () => {
    it.effect('backfills target balance from the opening debt event', () =>
        Effect.gen(function* () {
            const openingDebtAmount = 1_500_000;

            yield* Effect.promise(() =>
                testDb.$client.runAsync(
                    `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance, debt_type)
             VALUES ('Zero Target Debt', 'zero target debt', 'DEBT', 'LIABILITY', 'Landmark', 1, 910, NULL, 1, 1, 0, 'BORROW')`
                )
            );

            const account = yield* Effect.promise(() =>
                testDb.$client.getFirstAsync<{ id: number }>(`SELECT id FROM accounts WHERE title = 'Zero Target Debt'`)
            );
            const accountId = getDefined(account?.id, () => {
                throw new Error('Zero Target Debt account was not inserted');
            });

            yield* Effect.promise(() =>
                testDb.$client.runAsync(
                    `INSERT INTO debt_events (debt_account_id, transaction_id, transaction_entry_id, direction, source, operated_at, amount)
             VALUES (?, NULL, NULL, 'OPEN', 'INCOME_ATTACHMENT', 1780000000, ?)`,
                    [accountId, openingDebtAmount]
                )
            );

            yield* applyMigration('0038_repair_zero_target_debt_accounts.sql');

            const repaired = yield* Effect.promise(() =>
                testDb.$client.getFirstAsync<{ target_balance: number }>(
                    `SELECT target_balance FROM accounts WHERE title = 'Zero Target Debt'`
                )
            );

            expect(repaired?.target_balance).toBe(openingDebtAmount);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves debt accounts without an opening event untouched', () =>
        Effect.gen(function* () {
            yield* Effect.promise(() =>
                testDb.$client.runAsync(
                    `INSERT INTO accounts (title, title_search, type, nature, icon, instrument_id, "order", iban, is_active, include_in_net_worth, target_balance, debt_type)
             VALUES ('Orphan Debt', 'orphan debt', 'DEBT', 'LIABILITY', 'Landmark', 1, 911, NULL, 1, 1, 0, 'BORROW')`
                )
            );

            yield* applyMigration('0038_repair_zero_target_debt_accounts.sql');

            const row = yield* Effect.promise(() =>
                testDb.$client.getFirstAsync<{ target_balance: number }>(`SELECT target_balance FROM accounts WHERE title = 'Orphan Debt'`)
            );

            expect(row?.target_balance).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
