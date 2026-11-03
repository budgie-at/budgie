// Port of tests/app-tests/flows/40.installment-plan.flow.yaml.
import { expect } from 'e2e';

import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('40 installment plan', { tags: ['transactions'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;

    await budgie.start({ fixture: '12.db' });
    await b.expectId(ctx, 'HomePage.TotalBalance', 10_000);

    await b.phase('create expense', async () => {
        await t.navigateToTransactions(ctx);
        await t.openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
        await t.typeDigits(ctx, '30');
        await t.selectAccount(ctx, 'E2E Expense Source');
        await c.createCategoryFromTransaction(ctx, 'E2E Installment Category');
        await t.enterComment(ctx, 'E2E Installment Expense');
        await t.submitTransactionAndWait(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Installment_Expense', 5_000);
    });

    await b.phase('pay in parts', async () => {
        await t.openTransaction(ctx, 'E2E_Installment_Expense');
        await t.openInfoConversions(ctx);
        await b.tapText(ctx, 'Pay in parts');
        await b.expectId(ctx, 'ConvertToInstallment.Page', 10_000);
        await expect(b.byId(screen, 'ConvertToInstallment.TotalButton')).toHaveText(/90/);
        await expect(b.byId(screen, 'ConvertToInstallment.PartsLabel')).toHaveText(/^3 payments in total, .*30/i);
        await b.tapId(ctx, 'ConvertToInstallment.CreateButton');
        await b.expectId(ctx, 'InstallmentPlanScheduleSummary.Progress.1_3', 10_000);
    });
});
