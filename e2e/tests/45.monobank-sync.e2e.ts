import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('45 monobank sync', { tags: ['sync'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const card = 'Monobank Black •1234';

    await budgie.start({ fixture: '16.db' });

    await b.phase('rejected token', async () => {
        await b.openLink(ctx, 'budgie://create-account/MONOBANK');
        await b.expectId(ctx, 'CreateMonobankAccount.FetchAccountsButton', 10_000);
        await b.fillId(ctx, 'TokenInputStep.Input', 'e2e-rejected-token-0123456789abcdef');
        await b.tapId(ctx, 'CreateMonobankAccount.FetchAccountsButton');
        await b.expectText(
            ctx,
            'The API key or token was rejected. Check that it is correct, read-only and not restricted to other IP addresses.',
            15_000
        );
    });

    await b.phase('accounts and jars come from the bank', async () => {
        await b.tapId(ctx, 'TokenInputStep.Input');
        await b.byId(screen, 'TokenInputStep.Input').pressSequentially('e2e-monobank-token-0123456789abcdef');
        await b.tapId(ctx, 'CreateMonobankAccount.FetchAccountsButton');
        await b.expectText(ctx, 'Accounts · 1', 15_000);
        await b.expectId(ctx, 'SyncAccountSelection.Row.Monobank_Black_1234');
        await b.expectId(ctx, 'SyncAccountSelection.Row.Monobank_E2E_Jar_');
    });

    await b.phase('start syncing only new transactions', async () => {
        await b.tapId(ctx, 'SyncAccountSelection.Row.Monobank_Black_1234');
        await b.tapId(ctx, 'CreateMonobankAccount.ContinueButton');
        await b.tapId(ctx, 'SyncHistoryDepthOption.NEW_ONLY');
        await b.tapId(ctx, 'CreateMonobankAccount.StartSyncButton');
        await b.expectId(ctx, 'HomePage.TotalBalance', 30_000);
    });

    await b.phase('transactions and balance arrive', async () => {
        await b.openLink(ctx, 'budgie://transactions');
        await expect(screen.getByRole('button', { name: new RegExp(`^E2E Grocery, ₴250,.*${card}$`, 'u') }).first()).toBeVisible({
            timeout: 180_000
        });
        await expect(screen.getByRole('button', { name: new RegExp(`^E2E Salary, \\+₴1,000,.*${card}$`, 'u') }).first()).toBeVisible();
        await b.tapId(ctx, 'TabBar.Home');
        await b.scrollTo(ctx, `AccountCard.${card}`);
        await expect(b.byId(screen, `AccountCard.${card}`)).toHaveText(/₴1,500, Up to date$/);
    });
});
