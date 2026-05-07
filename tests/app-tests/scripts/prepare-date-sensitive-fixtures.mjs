#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDirectoryPath = path.resolve(__dirname, '../fixtures');
const outputDirectoryPath = process.argv[2];

if (!outputDirectoryPath) {
    console.error('Usage: prepare-date-sensitive-fixtures.mjs <output-directory>');
    process.exit(1);
}

mkdirSync(outputDirectoryPath, { recursive: true });

const runSqlite = (databasePath, sql) => {
    execFileSync('sqlite3', [databasePath, sql], { stdio: 'inherit' });
};

const backupFixture = (sourcePath, targetPath) => {
    execFileSync('sqlite3', [sourcePath, `.backup ${targetPath}`], { stdio: 'inherit' });
};

const shiftTransactionsFixtureToNow = () => {
    const sourcePath = path.join(fixturesDirectoryPath, '14.db');
    const targetPath = path.join(outputDirectoryPath, '14.db');

    backupFixture(sourcePath, targetPath);
    runSqlite(
        targetPath,
        `
        BEGIN;
        CREATE TEMP TABLE fixture_offset AS
        SELECT CAST(strftime('%s', 'now') AS INTEGER) - MAX(operated_at) AS seconds
        FROM transactions;

        UPDATE transactions
        SET operated_at = operated_at + (SELECT seconds FROM fixture_offset),
            created_at = created_at + (SELECT seconds FROM fixture_offset),
            updated_at = updated_at + (SELECT seconds FROM fixture_offset);

        UPDATE transaction_entries
        SET created_at = created_at + (SELECT seconds FROM fixture_offset),
            updated_at = updated_at + (SELECT seconds FROM fixture_offset);

        UPDATE account_balances
        SET created_at = created_at + (SELECT seconds FROM fixture_offset),
            updated_at = updated_at + (SELECT seconds FROM fixture_offset);

        UPDATE settings
        SET updated_at = CAST(strftime('%s', 'now') AS INTEGER);

        DROP TABLE fixture_offset;
        COMMIT;
        VACUUM;
        `
    );
};

const buildLocalNoonDate = (year, month, day) => new Date(year, month, day, 12, 0, 0, 0);

const getClampedDay = (year, month, day) => {
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

    return Math.min(day, lastDayOfMonth);
};

const buildMonthlyTimestamp = (monthOffset, desiredDay) => {
    const now = new Date();
    const targetMonthDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const targetYear = targetMonthDate.getFullYear();
    const targetMonth = targetMonthDate.getMonth();
    const clampedDay = getClampedDay(targetYear, targetMonth, desiredDay);
    const targetDate = buildLocalNoonDate(targetYear, targetMonth, clampedDay);

    return Math.floor(targetDate.getTime() / 1000);
};

const generateRecurringFixture = () => {
    const sourcePath = path.join(fixturesDirectoryPath, '07.db');
    const targetPath = path.join(outputDirectoryPath, '20-recurring-calendar.db');

    const now = new Date();
    const today = now.getDate();
    const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const upcomingDay = Math.min(lastDayOfCurrentMonth, today + 5);
    const rentAmount = 120_000_000;
    const gymAmount = 25_000_000;
    const rentDates = [-3, -2, -1, 0].map(monthOffset => buildMonthlyTimestamp(monthOffset, today));
    const gymDates = [-3, -2, -1].map(monthOffset => buildMonthlyTimestamp(monthOffset, upcomingDay));
    const transactionValues = [
        ...rentDates.map(timestamp => `(${timestamp}, ${timestamp}, 'EXPENSE', 'E2E Recurring Rent', ${timestamp}, '', 1.0)`),
        ...gymDates.map(timestamp => `(${timestamp}, ${timestamp}, 'EXPENSE', 'E2E Recurring Gym', ${timestamp}, '', 1.0)`)
    ].join(',\n            ');
    const totalRecurringAmount = rentAmount * rentDates.length + gymAmount * gymDates.length;

    backupFixture(sourcePath, targetPath);
    runSqlite(
        targetPath,
        `
        BEGIN;

        DELETE FROM transaction_entries;
        DELETE FROM transactions;
        DELETE FROM account_balances;
        DELETE FROM sqlite_sequence
        WHERE name IN ('transactions', 'transaction_entries', 'account_balances');

        UPDATE accounts
        SET title = CASE id
            WHEN 1 THEN 'E2E Recurring Account'
            WHEN 2 THEN 'E2E Recurring Spare'
            ELSE title
        END,
            updated_at = CAST(strftime('%s', 'now') AS INTEGER),
            is_active = 1,
            include_in_net_worth = 1;

        UPDATE settings
        SET default_account_id = 1,
            default_instrument_id = 1,
            language = 'en',
            show_cents = 0,
            updated_at = CAST(strftime('%s', 'now') AS INTEGER);

        INSERT INTO transactions (
            created_at,
            updated_at,
            type,
            title,
            operated_at,
            comment,
            exchange_rate
        )
        VALUES
            ${transactionValues};

        INSERT INTO transaction_entries (
            created_at,
            updated_at,
            type,
            account_id,
            category_id,
            transaction_id,
            amount
        )
        SELECT
            transactions.created_at,
            transactions.updated_at,
            'CREDIT',
            1,
            CASE transactions.title
                WHEN 'E2E Recurring Rent' THEN 10
                ELSE 15
            END,
            transactions.id,
            CASE transactions.title
                WHEN 'E2E Recurring Rent' THEN ${rentAmount}
                ELSE ${gymAmount}
            END
        FROM transactions
        ORDER BY transactions.id;

        INSERT INTO account_balances (
            created_at,
            updated_at,
            account_id,
            amount
        )
        VALUES
            (CAST(strftime('%s', 'now') AS INTEGER), CAST(strftime('%s', 'now') AS INTEGER), 1, ${totalRecurringAmount}),
            (CAST(strftime('%s', 'now') AS INTEGER), CAST(strftime('%s', 'now') AS INTEGER), 2, 0);

        COMMIT;
        VACUUM;
        `
    );
};

const generateConsolidationFixture = () => {
    const sourcePath = path.join(fixturesDirectoryPath, '07.db');
    const targetPath = path.join(outputDirectoryPath, '21.db');

    const now = Math.floor(Date.now() / 1000);
    const tOpening = now - 24 * 60 * 60;
    const tFastExpense = now - 30;
    const tFastIncome = now - 25;
    const tCross = now - 60 * 60;
    const tAtm = now - 90 * 60;
    const tUntouched = now - 5 * 60;

    const uahId = 33;
    const usdId = 1;
    const eurId = 2;

    const u200 = 200_000_000;
    const u100 = 100_000_000;
    const u92 = 92_000_000;
    const u500 = 500_000_000;
    const u50 = 50_000_000;
    const u1000 = 1_000_000_000;

    const balanceA = u1000 - u200 - u50;
    const balanceB = u200;
    const balanceUsd = 0;
    const balanceEur = u92;
    const balanceCard = u1000 - u500;

    backupFixture(sourcePath, targetPath);

    runSqlite(
        targetPath,
        `
        BEGIN;

        DELETE FROM transaction_entries;
        DELETE FROM transactions;
        DELETE FROM transaction_tags;
        DELETE FROM account_balances;
        DELETE FROM accounts;
        DELETE FROM sqlite_sequence
        WHERE name IN ('transactions', 'transaction_entries', 'accounts', 'account_balances', 'transaction_tags');

        INSERT INTO accounts (id, created_at, updated_at, icon, "order", title, type, nature, instrument_id, external_source, iban, is_active, include_in_net_worth)
        VALUES
            (1, ${now}, ${now}, 'Wallet',     1, 'E2E Consolidation A',          'BANK_SYNC', 'ASSET', ${uahId}, 'MONOBANK', 'UA000000000000000000000000A1', 1, 1),
            (2, ${now}, ${now}, 'Wallet',     2, 'E2E Consolidation B',          'BANK_SYNC', 'ASSET', ${uahId}, 'MONOBANK', 'UA000000000000000000000000B1', 1, 1),
            (3, ${now}, ${now}, 'Wallet',     3, 'E2E Consolidation USD',        'BANK_SYNC', 'ASSET', ${usdId}, 'MONOBANK', 'UA000000000000000000000000U1', 1, 1),
            (4, ${now}, ${now}, 'Wallet',     4, 'E2E Consolidation EUR',        'BANK_SYNC', 'ASSET', ${eurId}, 'MONOBANK', 'UA000000000000000000000000E1', 1, 1),
            (5, ${now}, ${now}, 'CreditCard', 5, 'E2E Consolidation Card',       'BANK_SYNC', 'ASSET', ${uahId}, 'MONOBANK', 'UA000000000000000000000000C1', 1, 1),
            (6, ${now}, ${now}, 'Wallet',     6, 'E2E Consolidation Cash',       'CASH',      'ASSET', ${uahId}, NULL,       NULL,                            1, 1),
            (7, ${now}, ${now}, 'Wallet',     7, 'E2E Consolidation Untouched',  'BANK_SYNC', 'ASSET', ${uahId}, 'MONOBANK', 'UA000000000000000000000000T1', 1, 1);

        INSERT INTO bank_syncs (account_id, provider, enabled, mode, status, token, created_at, updated_at)
        VALUES
            (1, 'MONOBANK', 0, 'BACKWARD', 'IDLE', '', ${now}, ${now}),
            (2, 'MONOBANK', 0, 'BACKWARD', 'IDLE', '', ${now}, ${now}),
            (3, 'MONOBANK', 0, 'BACKWARD', 'IDLE', '', ${now}, ${now}),
            (4, 'MONOBANK', 0, 'BACKWARD', 'IDLE', '', ${now}, ${now}),
            (5, 'MONOBANK', 0, 'BACKWARD', 'IDLE', '', ${now}, ${now}),
            (7, 'MONOBANK', 0, 'BACKWARD', 'IDLE', '', ${now}, ${now});

        INSERT INTO transactions (id, created_at, updated_at, type, title, comment, operated_at, exchange_rate, from_account_id, to_account_id, external_source, external_id)
        VALUES
            (1, ${tOpening},     ${tOpening},     'ADJUSTMENT', '',                              '', ${tOpening},     1.0, NULL, 1,    NULL,       NULL),
            (2, ${tOpening},     ${tOpening},     'ADJUSTMENT', '',                              '', ${tOpening},     1.0, NULL, 3,    NULL,       NULL),
            (3, ${tOpening},     ${tOpening},     'ADJUSTMENT', '',                              '', ${tOpening},     1.0, NULL, 5,    NULL,       NULL),
            (4, ${tFastExpense}, ${tFastExpense}, 'EXPENSE',    'E2E Consolidation P1 Out',     '', ${tFastExpense}, 1.0, 1,    NULL, 'MONOBANK', 'e2e-p1-out'),
            (5, ${tFastIncome},  ${tFastIncome},  'INCOME',     'E2E Consolidation P1 In',      '', ${tFastIncome},  1.0, NULL, 2,    'MONOBANK', 'e2e-p1-in'),
            (6, ${tCross},       ${tCross},       'EXPENSE',    'E2E Consolidation P2 Out',     '', ${tCross},       1.0, 3,    NULL, 'MONOBANK', 'e2e-p2-out'),
            (7, ${tCross},       ${tCross},       'INCOME',     'E2E Consolidation P2 In',      '', ${tCross},       1.0, NULL, 4,    'MONOBANK', 'e2e-p2-in'),
            (8, ${tAtm},         ${tAtm},         'EXPENSE',    'E2E Consolidation ATM Out',    '', ${tAtm},         1.0, 5,    NULL, 'MONOBANK', 'e2e-atm-out'),
            (9, ${tUntouched},   ${tUntouched},   'EXPENSE',    'E2E Consolidation Untouched',  '', ${tUntouched},   1.0, 1,    NULL, NULL,        NULL);

        INSERT INTO transaction_entries (transaction_id, account_id, type, amount, external_id, mcc_category_id, created_at, updated_at)
        VALUES
            (1, 1, 'DEBIT',  ${u1000}, NULL,                NULL,                                                       ${tOpening},     ${tOpening}),
            (2, 3, 'DEBIT',  ${u100},  NULL,                NULL,                                                       ${tOpening},     ${tOpening}),
            (3, 5, 'DEBIT',  ${u1000}, NULL,                NULL,                                                       ${tOpening},     ${tOpening}),
            (4, 1, 'CREDIT', ${u200},  'e2e-p1-out-entry',  (SELECT id FROM mcc_categories WHERE mcc = '6011' LIMIT 1), ${tFastExpense}, ${tFastExpense}),
            (5, 2, 'DEBIT',  ${u200},  'e2e-p1-in-entry',   (SELECT id FROM mcc_categories WHERE mcc = '6011' LIMIT 1), ${tFastIncome},  ${tFastIncome}),
            (6, 3, 'CREDIT', ${u100},  'e2e-p2-out-entry',  NULL,                                                       ${tCross},       ${tCross}),
            (7, 4, 'DEBIT',  ${u92},   'e2e-p2-in-entry',   NULL,                                                       ${tCross},       ${tCross}),
            (8, 5, 'CREDIT', ${u500},  'e2e-atm-out-entry', (SELECT id FROM mcc_categories WHERE mcc = '6011' LIMIT 1), ${tAtm},         ${tAtm}),
            (9, 1, 'CREDIT', ${u50},   NULL,                NULL,                                                       ${tUntouched},   ${tUntouched});

        INSERT INTO account_balances (account_id, amount, created_at, updated_at)
        VALUES
            (1, ${balanceA},     ${now}, ${now}),
            (2, ${balanceB},     ${now}, ${now}),
            (3, ${balanceUsd},   ${now}, ${now}),
            (4, ${balanceEur},   ${now}, ${now}),
            (5, ${balanceCard},  ${now}, ${now}),
            (6, 0,               ${now}, ${now}),
            (7, 0,               ${now}, ${now});

        UPDATE settings
        SET default_account_id = 1,
            default_instrument_id = ${uahId},
            language = 'en',
            show_cents = 0,
            updated_at = ${now};

        COMMIT;
        VACUUM;
        `
    );
};

const generateRefundConsolidationFixture = () => {
    const sourcePath = path.join(fixturesDirectoryPath, '07.db');
    const targetPath = path.join(outputDirectoryPath, '22.db');

    const now = Math.floor(Date.now() / 1000);
    const tOpening = now - 24 * 60 * 60;
    const tPartialExpense = now - 5 * 60;
    const tPartialRefund = now - 4 * 60;
    const tFullExpense = now - 10 * 60;
    const tFullRefund = now - 9 * 60;
    const tAmbiguousFirstExpense = now - 15 * 60;
    const tAmbiguousSecondExpense = now - 14 * 60;
    const tAmbiguousRefund = now - 13 * 60;

    const uahId = 33;

    const u30 = 30_000_000;
    const u40 = 40_000_000;
    const u55 = 55_000_000;
    const u120 = 120_000_000;
    const u1000 = 1_000_000_000;

    const balance = u1000 - u120 + u40 - u55 + u55 - u30 - u30 + u30;

    backupFixture(sourcePath, targetPath);

    runSqlite(
        targetPath,
        `
        BEGIN;

        DELETE FROM transaction_entries;
        DELETE FROM transactions;
        DELETE FROM transaction_tags;
        DELETE FROM account_balances;
        DELETE FROM accounts;
        DELETE FROM sqlite_sequence
        WHERE name IN ('transactions', 'transaction_entries', 'accounts', 'account_balances', 'transaction_tags');

        INSERT INTO accounts (id, created_at, updated_at, icon, "order", title, type, nature, instrument_id, external_source, iban, is_active, include_in_net_worth)
        VALUES
            (1, ${now}, ${now}, 'Wallet', 1, 'E2E Refund Card', 'BANK_SYNC', 'ASSET', ${uahId}, 'MONOBANK', 'UA000000000000000000000000R1', 1, 1);

        INSERT INTO bank_syncs (account_id, provider, enabled, mode, status, token, created_at, updated_at)
        VALUES
            (1, 'MONOBANK', 0, 'BACKWARD', 'IDLE', '', ${now}, ${now});

        INSERT INTO transactions (id, created_at, updated_at, type, title, comment, operated_at, exchange_rate, from_account_id, to_account_id, external_source, external_id)
        VALUES
            (1, ${tOpening},                 ${tOpening},                 'ADJUSTMENT', '',                     '', ${tOpening},                 1.0, NULL, 1,    NULL,       NULL),
            (2, ${tPartialExpense},          ${tPartialExpense},          'EXPENSE',    'E2E Refund Partial',   '', ${tPartialExpense},          1.0, 1,    NULL, 'MONOBANK', 'e2e-refund-partial-expense'),
            (3, ${tPartialRefund},           ${tPartialRefund},           'INCOME',     'E2E Refund Partial',   '', ${tPartialRefund},           1.0, NULL, 1,    'MONOBANK', 'e2e-refund-partial-income'),
            (4, ${tFullExpense},             ${tFullExpense},             'EXPENSE',    'E2E Refund Full',      '', ${tFullExpense},             1.0, 1,    NULL, 'MONOBANK', 'e2e-refund-full-expense'),
            (5, ${tFullRefund},              ${tFullRefund},              'INCOME',     'E2E Refund Full',      '', ${tFullRefund},              1.0, NULL, 1,    'MONOBANK', 'e2e-refund-full-income'),
            (6, ${tAmbiguousFirstExpense},   ${tAmbiguousFirstExpense},   'EXPENSE',    'E2E Refund Ambiguous', '', ${tAmbiguousFirstExpense},   1.0, 1,    NULL, 'MONOBANK', 'e2e-refund-ambiguous-expense-first'),
            (7, ${tAmbiguousSecondExpense},  ${tAmbiguousSecondExpense},  'EXPENSE',    'E2E Refund Ambiguous', '', ${tAmbiguousSecondExpense},  1.0, 1,    NULL, 'MONOBANK', 'e2e-refund-ambiguous-expense-second'),
            (8, ${tAmbiguousRefund},         ${tAmbiguousRefund},         'INCOME',     'E2E Refund Ambiguous', '', ${tAmbiguousRefund},         1.0, NULL, 1,    'MONOBANK', 'e2e-refund-ambiguous-income');

        INSERT INTO transaction_entries (transaction_id, account_id, type, amount, external_id, category_id, mcc_category_id, created_at, updated_at)
        VALUES
            (1, 1, 'DEBIT',  ${u1000}, NULL,                         NULL, NULL, ${tOpening},                ${tOpening}),
            (2, 1, 'CREDIT', ${u120},  'e2e-refund-partial-expense',  12,   NULL, ${tPartialExpense},         ${tPartialExpense}),
            (3, 1, 'DEBIT',  ${u40},   'e2e-refund-partial-income',   12,   NULL, ${tPartialRefund},          ${tPartialRefund}),
            (4, 1, 'CREDIT', ${u55},   'e2e-refund-full-expense',     13,   NULL, ${tFullExpense},            ${tFullExpense}),
            (5, 1, 'DEBIT',  ${u55},   'e2e-refund-full-income',      13,   NULL, ${tFullRefund},             ${tFullRefund}),
            (6, 1, 'CREDIT', ${u30},   'e2e-refund-ambiguous-first',  NULL, NULL, ${tAmbiguousFirstExpense},  ${tAmbiguousFirstExpense}),
            (7, 1, 'CREDIT', ${u30},   'e2e-refund-ambiguous-second', NULL, NULL, ${tAmbiguousSecondExpense}, ${tAmbiguousSecondExpense}),
            (8, 1, 'DEBIT',  ${u30},   'e2e-refund-ambiguous-income', NULL, NULL, ${tAmbiguousRefund},        ${tAmbiguousRefund});

        INSERT INTO account_balances (account_id, amount, created_at, updated_at)
        VALUES
            (1, ${balance}, ${now}, ${now});

        UPDATE settings
        SET default_account_id = 1,
            default_instrument_id = ${uahId},
            language = 'en',
            show_cents = 0,
            updated_at = ${now};

        COMMIT;
        VACUUM;
        `
    );
};

shiftTransactionsFixtureToNow();
generateRecurringFixture();
generateConsolidationFixture();
generateRefundConsolidationFixture();
