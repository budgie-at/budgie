// The one-off database fixture builders (formerly tests/app-tests/flows/setup/capture-*-fixture): each seeds a staged fixture, builds its accounts or transactions through the real UI, and writes
// the app's database to tests/app-tests/fixtures/<name>. Never part of a capture or the smoke: CAPTURE_FIXTURES=1
// runs them (tests/app-tests/scripts/capture-fixture.sh).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as a from '../support/budgie/accounts.ts';
import * as c from '../support/budgie/categories.ts';
import { Budgie } from '../support/budgie/core.ts';
import * as b from '../support/budgie/core.ts';
import { BUNDLE_ID } from '../support/budgie/fixtures.ts';
import * as t from '../support/budgie/transactions.ts';
import { createTagFromTransaction, shellQuote, workerShell } from '../support/media/steps.ts';
import { test } from '../support/media/test.ts';
import { exec } from '../support/simlock/exec.ts';

const FIXTURES = fileURLToPath(new URL('../../tests/app-tests/fixtures/', import.meta.url));
const skip = process.env.CAPTURE_FIXTURES === '1' ? false : 'builds a committed fixture; CAPTURE_FIXTURES=1 runs it';

/**
 * capture-fixture.sh's snapshot: the app stopped, its database and WAL read
 * off the device through the worker's shell, checkpointed and backed up here.
 * Needs a worker whose CoreSimulator still spawns the Mac's tools (macOS 15).
 */
async function snapshot(budgie: Budgie, name: string): Promise<void> {
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
        execFileSync('sqlite3', [source, 'PRAGMA wal_checkpoint(TRUNCATE);'], { stdio: 'ignore' });
        const target = join(FIXTURES, name);
        rmSync(target, { force: true });
        execFileSync('sqlite3', [source, `.backup ${target}`]);
        const counts = execFileSync('sqlite3', [
            target,
            "SELECT 'accounts', COUNT(*) FROM accounts; SELECT 'transactions', COUNT(*) FROM transactions;"
        ]);
        console.log(`[fixture] captured ${target}\n${counts.toString().trim()}`);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

test('fixture 29.db', { skip }, async ({ media }) => {
    const budgie = new Budgie(media.ctx);
    const { ctx } = budgie;
    await budgie.start({ fixture: '02.db' });
    await a.createLiabilityAccount(ctx, { typeId: 'CreateAccount.CASH', name: 'E2E Fiat Pocket', currency: 'EUR', amount: '100' });
    await a.createCryptoAccount(ctx, { name: 'E2E Crypto Vault', currency: 'BTC', amount: '2' });
    await a.createCryptoAccount(ctx, { name: 'E2E Binance BTC', currency: 'BTC', amount: '2' });
    await a.createCryptoAccount(ctx, { name: 'E2E Ethereum Stack', currency: 'ETH', amount: '1' });
    await snapshot(budgie, '29.db');
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
        { name: 'E2E Borrowed Debt', currentBalance: '15000', debtType: 'BORROW', targetBalance: '15000' },
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
