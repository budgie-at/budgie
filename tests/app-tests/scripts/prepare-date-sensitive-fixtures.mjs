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

shiftTransactionsFixtureToNow();
generateRecurringFixture();
