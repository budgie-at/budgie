import { expect } from 'e2e';

import * as bu from '../support/budgie/budget.ts';
import * as b from '../support/budgie/core.ts';
import { selectTagBySearch } from '../support/budgie/tags.ts';
import { test } from '../support/budgie/test.ts';
import {
    enterComment,
    navigateToTransactions,
    openTransactionForm,
    selectAccount,
    selectExistingTag,
    submitTransactionAndWait,
    typeDigits
} from '../support/budgie/transactions.ts';

const ACCOUNT = 'Rules Test Account';
const CATEGORY = 'Rules Test Category';
const TAG = 'Rules Test Tag';
const EVENT = 'E2E Trip';
const EXPENSE_COMMENT = 'E2E Budget Event Match';
const FUND = 'E2E Insurance Fund';

test('43 budget v3', { tags: ['budget'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const budgetDetails = async () => {
        await b.openLink(ctx, 'budgie://budget');
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
    };

    // setup/setup-budget-test
    await budgie.start({ fixture: 'budget-base.db', wait: 'tabbar' });

    await b.phase('weekly budget', async () => {
        await bu.openEmptyBudget(ctx);
        await bu.chooseEmptyCanvas(ctx);
        await b.tapText(ctx, 'Week');
        await b.expectId(ctx, 'BudgetSetup.StartsOnRow', 3_000);
        await bu.setOverallLimit(ctx, '1000');
        await bu.saveFromHeader(ctx);
        await b.expectId(ctx, 'BudgetWidget.Card', 3_000);
        await b.tapId(ctx, 'BudgetWidget.Card');
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
        await expect(id('BudgetDetails.Verdict')).toHaveText(/[1-7] days? left/, { timeout: 3_000 });
        await b.tapId(ctx, 'BudgetDetails.EditButton');
        await expect(b.byText(screen, 'Edit budget')).toBeVisible({ timeout: 3_000 });
        await expect(b.byText(screen, 'Week')).toBeSelected();
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
    });

    await b.phase('tagged expense', async () => {
        await navigateToTransactions(ctx);
        await openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
        await typeDigits(ctx, '42');
        await selectAccount(ctx, ACCOUNT);
        await b.tapId(ctx, 'TransactionForm.CategorySelector');
        await b.selectCategoryBySearch(ctx, CATEGORY);
        await selectExistingTag(ctx, TAG);
        await enterComment(ctx, EXPENSE_COMMENT);
        await submitTransactionAndWait(ctx);
        await budgetDetails();
        await expect(id('BudgetDetails.SpentLabel')).toHaveText('€42');
    });

    await b.phase('event budget', async () => {
        await b.scrollTo(ctx, 'BudgetDetails.EventAddButton');
        await b.sleep(400);
        await b.tapId(ctx, 'BudgetDetails.EventAddButton');
        await b.expectId(ctx, 'BudgetEvent.NameInput', 3_000);
        await b.fillId(ctx, 'BudgetEvent.NameInput', EVENT);
        await b.tapId(ctx, 'BudgetEvent.TagField');
        await selectTagBySearch(ctx, TAG);
        await b.expectId(ctx, 'BudgetEvent.LimitInput', 3_000);
        await bu.fillAmount(ctx, 'BudgetEvent.LimitInput', '500');
        await b.tapText(ctx, 'Category limits');
        await b.tapId(ctx, 'BudgetEvent.SaveButton');
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
        const event = screen
            .getByTestId(/^BudgetDetails\.EventRow\./)
            .filter({ hasText: new RegExp(`^${EVENT}, `, 'i') })
            .first();
        await screen.scrollUntilVisible(event, { direction: 'down', timeout: 20_000 });
        await event.tap();
        await expect(b.byText(screen, 'Tagged expenses also count in your main budget.')).toBeVisible({ timeout: 3_000 });
        await expect(id('BudgetDetails.SpentLabel')).toHaveText('€42');
        await expect(id('BudgetDetails.LimitLabel')).toHaveText('€500');
    });

    await b.phase('set aside: fund', async () => {
        await budgetDetails();
        await b.scrollTo(ctx, 'BudgetDetails.FundAddButton');
        await b.tapId(ctx, 'BudgetDetails.FundAddButton');
        await b.expectId(ctx, 'BudgetFund.TargetInput', 3_000);
        await b.fillId(ctx, 'BudgetFund.TargetInput', '600');
        await b.fillId(ctx, 'BudgetFund.NameInput', FUND);
        await b.tapId(ctx, 'BudgetFund.CategoryField');
        await b.selectCategoryBySearch(ctx, CATEGORY);
        await b.tapId(ctx, 'BudgetFund.DueField');
        await b.expectId(ctx, 'DatePicker.Day.20', 10_000);
        await b.tapId(ctx, 'DatePicker.Day.20');
        await expect(id('BudgetFund.SaveButton')).toBeEnabled({ timeout: 3_000 });
        await b.tapId(ctx, 'BudgetFund.SaveButton');
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
        const row = screen
            .getByTestId(/^BudgetDetails\.FundRow\./)
            .filter({ hasText: new RegExp(`^${FUND}, `) })
            .first();
        await screen.scrollUntilVisible(row, { direction: 'down', timeout: 20_000 });
    });
});

test('43 missing event budget stays recoverable', { tags: ['budget'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    await budgie.start({ fixture: 'budget-base.db', wait: 'tabbar' });

    await b.openLink(ctx, 'budgie://budget/event/2147483647');
    await b.expectText(ctx, 'Budget unavailable');
    await b.expectText(ctx, 'Your transactions are not affected.');
    await b.tapId(ctx, 'PageHeader.BackButton');
    await b.expectId(ctx, 'TabBar.Home');

    await b.openLink(ctx, 'budgie://budget/event/2147483647/edit');
    await b.expectText(ctx, 'Budget unavailable');
    await b.expectNoId(ctx, 'BudgetEvent.SaveButton');
    await b.tapId(ctx, 'PageHeader.BackButton');
    await b.expectId(ctx, 'TabBar.Home');
});
