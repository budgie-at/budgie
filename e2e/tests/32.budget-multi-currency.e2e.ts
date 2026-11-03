// Port of tests/app-tests/flows/32.budget-multi-currency.flow.yaml.
import { expect } from 'e2e';

import * as bu from '../support/budgie/budget.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import {
    deleteTransaction,
    enterComment,
    navigateToTransactions,
    openTransactionForm,
    selectAccount,
    submitTransactionAndWait,
    typeDigits
} from '../support/budgie/transactions.ts';

const EUR_ACCOUNT = 'E2E Foreign Account';
const CATEGORY = 'Groceries';
const COMMENT = 'E2E Budget MC Category Txn';
const CARD = 'TransactionCard.Label.E2E_Budget_MC_Category_Txn';

test('32 budget multi currency', { tags: ['budget'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const categoryShare = async (share: string) => {
        await b.tapId(ctx, 'TabBar.Home');
        await expect(id('BudgetWidget.CategorySpentLabel.11')).toHaveText(share, { timeout: 3_000 });
    };

    // setup/setup-multi-currency-budget
    await budgie.start({ fixture: 'budget-multi-currency.db', wait: 'tabbar' });

    await b.phase('create budget with a category limit', async () => {
        await bu.openEmptyBudget(ctx);
        await bu.chooseEmptyCanvas(ctx);
        await bu.setOverallLimit(ctx, '200');
        await bu.addCategoryLimit(ctx, CATEGORY);
        await bu.fillAmount(ctx, 'BudgetSetup.CategoryLimit.0.AmountInput', '80');
        await bu.saveBudgetSetup(ctx);
    });

    await b.phase('converted totals', async () => {
        await expect(id('BudgetWidget.SpentLabel')).toHaveText('€136 / €200');
        await b.tapId(ctx, 'BudgetWidget.Card');
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
        await expect(id('BudgetDetails.SpentLabel')).toHaveText('€136');
        await expect(id('BudgetDetails.LimitLabel')).toHaveText('€200');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'BudgetWidget.Card', 3_000);
        await b.expectId(ctx, 'BudgetWidget.CategoryRow.11');
        await expect(id('BudgetWidget.CategorySpentLabel.11')).toHaveText('0%');
    });

    await b.phase('foreign-currency expense counts toward the category', async () => {
        await navigateToTransactions(ctx);
        await openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
        await typeDigits(ctx, '40');
        await selectAccount(ctx, EUR_ACCOUNT);
        await b.tapId(ctx, 'TransactionForm.CategorySelector');
        await b.selectCategoryBySearch(ctx, CATEGORY);
        await enterComment(ctx, COMMENT);
        await submitTransactionAndWait(ctx);
        await b.expectId(ctx, CARD, 15_000);
        await categoryShare('50%');
    });

    await b.phase('deleting it resets the category', async () => {
        await navigateToTransactions(ctx);
        await b.tapId(ctx, CARD);
        await deleteTransaction(ctx);
        await navigateToTransactions(ctx);
        await b.expectNoId(ctx, CARD);
        await b.expectId(ctx, 'TabBar.Home', 10_000);
        await categoryShare('0%');
    });
});
