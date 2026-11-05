import { scrollTo } from '@mobile-ci/e2e-simlock/steps';
import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('46 recurring make recurring from a transaction', { tags: ['recurring'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '20.db' });

    await b.phase('create a one-off expense', async () => {
        await t.createExpense(ctx, {
            amount: '10',
            account: 'E2E Recurring Account',
            category: 'Groceries',
            comment: 'E2E One Off Expense'
        });
        await b.expectId(ctx, 'TransactionCard.Label.E2E_One_Off_Expense', 5_000);
    });

    await b.phase('make it recurring', async () => {
        await t.openTransaction(ctx, 'E2E_One_Off_Expense');
        await b.scrollTo(ctx, 'TransactionActionsMenu.MakeRecurringButton');
        await b.tapId(ctx, 'TransactionActionsMenu.MakeRecurringButton');
        await b.expectId(ctx, 'MakeRecurring.Page', 10_000);
        await b.tapId(ctx, 'MakeRecurring.CreateRow');
        await b.expectId(ctx, 'RecurringForm.Page', 10_000);
        await b.tapId(ctx, 'RecurringForm.Save');
        await b.expectId(ctx, 'RecurringDetail.Page', 10_000);
    });

    await b.phase('series detail lists the transaction in its history', async () => {
        const historyRow = ctx.screen.getByTestId(/^RecurringDetail\.HistoryRow\.\d+$/u).first();
        await scrollTo(ctx.screen, historyRow, 'down');
        await b.expectText(ctx, 'Payment history');
        await expect(historyRow).toBeVisible({ timeout: 5_000 });
    });
});
