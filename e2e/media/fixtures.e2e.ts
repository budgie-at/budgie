// The one-off database fixture builders (formerly tests/app-tests/flows/setup/capture-*-fixture): each seeds a staged fixture, builds its accounts or transactions through the real UI, and writes
// the app's database to tests/app-tests/fixtures/<name>. Never part of a capture or the smoke: CAPTURE_FIXTURES=1
// runs them (tests/app-tests/scripts/capture-fixture.sh).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { exec } from '@mobile-ci/e2e-simlock/exec';

import * as a from '../support/budgie/accounts.ts';
import * as c from '../support/budgie/categories.ts';
import { Budgie } from '../support/budgie/core.ts';
import * as b from '../support/budgie/core.ts';
import { BUNDLE_ID } from '../support/budgie/fixtures.ts';
import * as t from '../support/budgie/transactions.ts';
import { createTagFromTransaction, shellQuote, workerShell } from '../support/media/steps.ts';
import { test } from '../support/media/test.ts';

const FIXTURES = fileURLToPath(new URL('../../tests/app-tests/fixtures/', import.meta.url));
/** The app-tests' node:sqlite stand-in for the sqlite3 CLI: the same on every host, Linux runners included. */
const SQLITE3 = fileURLToPath(new URL('../../tests/app-tests/scripts/sqlite-fallback/sqlite3', import.meta.url));
const skip = process.env.CAPTURE_FIXTURES === '1' ? false : 'builds a committed fixture; CAPTURE_FIXTURES=1 runs it';

/**
 * capture-fixture.sh's snapshot: the app stopped, its database and WAL read
 * off the device through the worker's shell, checkpointed, `finish` applied,
 * and vacuumed into place. Needs a worker whose CoreSimulator still spawns the
 * Mac's tools (macOS 15).
 */
async function snapshot(budgie: Budgie, name: string, finish?: { sql: string; check: string }): Promise<void> {
    const lease = await budgie.lease();
    const sqlite = `${await budgie.container()}/Documents/SQLite`;
    await exec(budgie.api, lease, ['terminate', BUNDLE_ID]);
    await b.sleep(2_000);
    const dir = mkdtempSync(join(tmpdir(), 'budgie-fixture-'));
    try {
        for (const suffix of ['', '-wal']) {
            const path = `${sqlite}/budgie.db${suffix}`;
            const b64 = await workerShell(budgie.api, lease, `[ ! -f ${shellQuote(path)} ] || /usr/bin/base64 -i ${shellQuote(path)}`);
            if (b64.trim() !== '') writeFileSync(join(dir, `budgie.db${suffix}`), Buffer.from(b64.replace(/\s+/g, ''), 'base64'));
        }
        const source = join(dir, 'budgie.db');
        const sql = (database: string, statements: string): string =>
            execFileSync(SQLITE3, [database, statements], { encoding: 'utf8' }).trim();
        sql(source, 'PRAGMA wal_checkpoint(TRUNCATE);');
        if (finish !== undefined) {
            sql(source, finish.sql);
            const matched = sql(source, finish.check);
            if (matched !== '1') throw new Error(`${name}: the finishing SQL matched ${matched} rows, not 1: ${finish.check}`);
        }
        const target = join(FIXTURES, name);
        rmSync(target, { force: true });
        sql(source, `VACUUM INTO '${target.replaceAll("'", "''")}';`);
        const counts = sql(target, "SELECT 'accounts', COUNT(*) FROM accounts; SELECT 'transactions', COUNT(*) FROM transactions;");
        console.log(`[fixture] captured ${target}\n${counts}`);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

/**
 * Turns the 'E2E Binance BTC' crypto account into a Binance-synced one
 * (CRYPTO_SYNC on SPOT:BTC, its integration and a disabled forward sync).
 * Connecting Binance in the UI fetches the accounts from api.binance.com
 * with real credentials, so the builder creates the account in the UI and
 * links it here, with placeholder credentials the app never sends.
 */
const BINANCE_SYNCED_ACCOUNT = {
    sql: `BEGIN;
INSERT INTO bank_integrations (provider, token) VALUES ('BINANCE', '{"apiKey":"e2e-binance-api-key","apiSecret":"e2e-binance-api-secret"}');
UPDATE accounts SET type = 'CRYPTO_SYNC', external_id = 'SPOT:BTC', external_source = 'BINANCE',
    integration_id = (SELECT id FROM bank_integrations WHERE provider = 'BINANCE')
WHERE title = 'E2E Binance BTC' AND type = 'CRYPTO';
INSERT INTO bank_syncs (account_id, provider, enabled, mode, status, forward_sync_from_at)
SELECT id, 'BINANCE', 0, 'FORWARD', 'IDLE', unixepoch() FROM accounts WHERE title = 'E2E Binance BTC' AND type = 'CRYPTO_SYNC';
COMMIT;`,
    check: "SELECT COUNT(*) FROM accounts a JOIN bank_syncs s ON s.account_id = a.id WHERE a.title = 'E2E Binance BTC' AND a.type = 'CRYPTO_SYNC' AND s.provider = 'BINANCE';"
};

test('fixture 29.db', { skip }, async ({ media }) => {
    const budgie = new Budgie(media.ctx);
    const { ctx } = budgie;
    await budgie.start({ fixture: '02.db' });
    await a.createLiabilityAccount(ctx, { typeId: 'CreateAccount.CASH', name: 'E2E Fiat Pocket', currency: 'EUR', amount: '100' });
    await a.createCryptoAccount(ctx, { name: 'E2E Crypto Vault', currency: 'BTC', amount: '2' });
    await a.createCryptoAccount(ctx, { name: 'E2E Binance BTC', currency: 'BTC', amount: '2' });
    await a.createCryptoAccount(ctx, { name: 'E2E Ethereum Stack', currency: 'ETH', amount: '1' });
    await snapshot(budgie, '29.db', BINANCE_SYNCED_ACCOUNT);
});

test('fixture 31-debt.db', { skip }, async ({ media }) => {
    const budgie = new Budgie(media.ctx);
    const { ctx } = budgie;
    await budgie.start({ fixture: '09.db' });
    await a.createLiabilityAccount(ctx, {
        typeId: 'CreateAccount.CASH',
        name: 'E2E EUR Debt Funding Account',
        currency: 'EUR',
        amount: '1000'
    });
    const debts = [
        { name: 'E2E Lent Expense Debt', currentBalance: '0', debtType: 'LENT', targetBalance: '1000' },
        { name: 'E2E Lent Debt', currentBalance: '2000', debtType: 'LENT', targetBalance: '15000' },
        // Part of it still owed: the app hides a settled debt from the home screen, and test 31 repays more of it there.
        { name: 'E2E Borrowed Debt', currentBalance: '13000', debtType: 'BORROW', targetBalance: '15000' },
        { name: 'E2E Completed Debt', currentBalance: '0', debtType: 'LENT', targetBalance: '300' }
    ] as const;
    for (const debt of debts) await a.createDebtAccount(ctx, { ...debt, currency: 'EUR' });
    await snapshot(budgie, '31-debt.db');
});

test('fixture 31-transaction-info.db', { skip }, async ({ media }) => {
    const budgie = new Budgie(media.ctx);
    const { ctx } = budgie;
    await budgie.start({ fixture: '08.db' });
    await t.navigateToTransactions(ctx);
    await t.openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
    await t.typeDigits(ctx, '10');
    await t.selectAccount(ctx, 'E2E Txn Account');
    await c.createCategoryFromTransaction(ctx, 'E2E Info Category');
    await createTagFromTransaction(ctx, 'E2E Info Tag');
    await b.tapId(ctx, 'tags-selector-modal-done-button');
    await b.expectNoId(ctx, 'TagPickerBottomSheet.Input');
    await t.enterComment(ctx, 'E2E Similar Expense');
    await t.submitTransactionAndWait(ctx);
    await t.createExpense(ctx, { amount: '10', account: 'E2E Txn Account', category: 'E2E Info Category', comment: 'E2E Similar Expense' });
    await snapshot(budgie, '31-transaction-info.db');
});
