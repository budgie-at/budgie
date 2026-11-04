import { scrollAbove } from '@mobile-ci/e2e-simlock/steps';
import { expect } from 'e2e';

import * as bu from '../support/budgie/budget.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import {
    createExpense,
    enterComment,
    navigateToTransactions,
    openTransactionForm,
    selectAccount,
    submitTransactionAndWait,
    typeDigits
} from '../support/budgie/transactions.ts';

const ACCOUNT = 'Rules Test Account';
const CATEGORY = 'Rules Test Category';
const MATCH_COMMENT = 'E2E Budget Details Match';

test('31 budget', { tags: ['budget'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const editBudget = b.byText(screen, 'Edit budget');
    const details = async (spent: string, limit: string) => {
        await expect(id('BudgetDetails.SpentLabel')).toHaveText(spent);
        await expect(id('BudgetDetails.LimitLabel')).toHaveText(limit);
    };
    const openBudgetCard = async () => {
        await b.tapId(ctx, 'BudgetWidget.Card');
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
    };
    const budgetSettings = async () => {
        await b.openLink(ctx, 'budgie://settings?anchor=budget');
    };
    const toggle = async (switchId: string, from: string, to: string) => {
        await expect(id(switchId)).toHaveValue(from, { timeout: 3_000 });
        await b.tapId(ctx, switchId);
        try {
            await expect(id(switchId)).toHaveValue(to, { timeout: 3_000 });
        } catch (cause) {
            // simctl cannot grant notifications on this runtime, so the push switch's system prompt is accepted here.
            try {
                await ctx.device.alert('accept');
            } catch {
                throw cause;
            }
            console.log('[alert] accepted the notifications prompt');
            await expect(id(switchId)).toHaveValue(to, { timeout: 3_000 });
        }
    };

    // setup/setup-budget-test
    await budgie.start({ fixture: 'budget-base.db', wait: 'tabbar' });

    await b.phase('settings entry with no budget', async () => {
        await b.tapId(ctx, 'TabBar.Settings');
        await b.expectId(ctx, 'SettingsPage.Container', 3_000);
        await budgetSettings();
        await b.expectId(ctx, 'SettingsPage.BudgetManagementCard', 3_000);
        await b.tapId(ctx, 'SettingsPage.BudgetManagementCard');
        await expect(b.byText(screen, 'Create budget')).toBeVisible({ timeout: 3_000 });
        await b.tapId(ctx, 'PageHeader.BackButton');
    });

    await b.phase('missing budget sheets stay readable', async () => {
        await b.openLink(ctx, 'budgie://budget/edit?id=999999');
        await expect(b.byText(screen, 'Budget unavailable')).toBeVisible({ timeout: 3_000 });
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.openLink(ctx, 'budgie://budget-limit-changes');
        await expect(b.byText(screen, 'Budget unavailable')).toBeVisible({ timeout: 3_000 });
        await b.tapText(ctx, 'Close');
        await expect(b.byText(screen, 'Budget unavailable')).toBeHidden();
        await b.openLink(ctx, 'budgie://');
        await b.openLink(ctx, 'budgie://budget-safe-to-spend?eventId=999999');
        await expect(b.byText(screen, 'Budget unavailable')).toBeVisible({ timeout: 3_000 });
        await b.tapText(ctx, 'Close');
        await expect(b.byText(screen, 'Budget unavailable')).toBeHidden();
        await b.openLink(ctx, 'budgie://');
        await b.openLink(ctx, 'budgie://budget-period-summary?snapshotId=999999');
        await expect(
            b.byText(screen, 'This period summary is no longer available. Close this screen to see your budget history.')
        ).toBeVisible({ timeout: 3_000 });
        await b.tapText(ctx, 'Close');
        await expect(b.byText(screen, 'Period summary unavailable')).toBeHidden();
        await b.openLink(ctx, 'budgie://');
    });

    await b.phase('create budget', async () => {
        await b.openLink(ctx, 'budgie://budget');
        await expect(b.byText(screen, 'Budget unavailable')).toBeVisible({ timeout: 3_000 });
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'BudgetWidget.EmptyState', 3_000);
        await b.tapId(ctx, 'BudgetWidget.EmptyState');
        await b.expectId(ctx, 'BudgetCreate.Template.Generic', 3_000);
        await b.expectNoId(ctx, 'BudgetCreate.Template.Suggested');
        await b.expectId(ctx, 'BudgetCreate.Template.Empty');
        await bu.chooseEmptyCanvas(ctx);
        await bu.setOverallLimit(ctx, '1000');
        await bu.saveFromHeader(ctx);
        await b.expectId(ctx, 'BudgetWidget.Card', 3_000);
        await expect(id('BudgetWidget.SpentLabel')).toHaveText('€0 / €1,000');
    });

    await b.phase('matching expense', async () => {
        await navigateToTransactions(ctx);
        await openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
        await typeDigits(ctx, '42');
        await selectAccount(ctx, ACCOUNT);
        await b.tapId(ctx, 'TransactionForm.CategorySelector');
        await b.selectCategoryBySearch(ctx, CATEGORY);
        await enterComment(ctx, MATCH_COMMENT);
        await submitTransactionAndWait(ctx);
        await b.tapId(ctx, 'TabBar.Home');
        await expect(id('BudgetWidget.SpentLabel')).toHaveText('€42 / €1,000', { timeout: 3_000 });
    });

    await b.phase('budget details and edits', async () => {
        await b.openLink(ctx, 'budgie://budget');
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
        await expect(editBudget).toBeHidden();
        await details('€42', '€1,000');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'BudgetWidget.Card', 3_000);
        await openBudgetCard();
        await expect(editBudget).toBeHidden();

        await bu.openEditBudget(ctx);
        await bu.setOverallLimit(ctx, '1500');
        await bu.saveFromHeader(ctx);
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
        await details('€42', '€1,500');

        // An unsaved edit is discarded on back.
        await bu.openEditBudget(ctx);
        await bu.setOverallLimit(ctx, '9999');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
        await expect(editBudget).toBeHidden();
        await details('€42', '€1,500');
    });

    await b.phase('four category limits', async () => {
        await bu.openEditBudget(ctx);
        await bu.addCategoryLimitWithAmount(ctx, CATEGORY, 0, '200');
        await bu.addCategoryLimitWithAmount(ctx, 'Groceries', 1, '100', false);
        await bu.addCategoryLimitWithAmount(ctx, 'Restaurants & Cafes', 2, '150', false);
        await bu.addCategoryLimitWithAmount(ctx, 'Car & Fuel', 3, '75', false);
        await b.expectId(ctx, 'BudgetSetup.SaveButton', 3_000);
        await b.tapId(ctx, 'BudgetSetup.SaveButton');
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'BudgetWidget.CategoryRow.42', 3_000);
        await expect(id('BudgetWidget.CategorySpentLabel.42')).toHaveText('21%');
        await b.expectId(ctx, 'BudgetWidget.CategoryRow.11');
        await expect(id('BudgetWidget.MoreCategoriesLabel')).toHaveText('+2 more');
        await b.expectNoId(ctx, 'BudgetWidget.CategoryRow.12');
        await b.expectNoId(ctx, 'BudgetWidget.CategoryRow.14');
    });

    await b.phase('category rows on details', async () => {
        await openBudgetCard();
        await b.scrollTo(ctx, 'BudgetDetails.CategoryRow.42');
        await b.expectId(ctx, 'BudgetDetails.CategoryRow.42');
        await expect(id('BudgetDetails.CategorySpentLabel.42')).toHaveText('€42');
        await b.scrollTo(ctx, 'BudgetDetails.CategoryRow.11', 'up');
        await b.expectId(ctx, 'BudgetDetails.CategoryRow.11');
        await b.expectId(ctx, 'BudgetDetails.CategoryRow.12');
        await b.scrollTo(ctx, 'BudgetDetails.CategoryRow.14');
        await b.scrollTo(ctx, 'BudgetDetails.CategoryRow.42');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'BudgetWidget.Card', 3_000);
    });

    await b.phase('category drill-down lists only its transactions', async () => {
        await createExpense(ctx, { amount: '10', account: ACCOUNT, category: 'Groceries', comment: 'E2E Budget Details Other Category' });
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Budget_Details_Other_Category', 5_000);
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'BudgetWidget.Card', 3_000);
        await openBudgetCard();
        await b.scrollTo(ctx, 'BudgetDetails.CategoryRow.42');
        await b.tapId(ctx, 'BudgetDetails.CategoryRow.42');
        await b.expectId(ctx, 'TransactionCard.Label.E2E_Budget_Details_Match', 3_000);
        await b.expectNoId(ctx, 'TransactionCard.Label.E2E_Budget_Details_Other_Category');
        await b.expectNoId(ctx, 'TransactionCard.Label.Spotify_Premium');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
    });

    await b.phase('remove and re-add a category limit', async () => {
        await bu.openEditBudget(ctx);
        await b.scrollTo(ctx, 'BudgetSetup.CategoryLimit.0.Row');
        await bu.swipeToDelete(ctx, 'BudgetSetup.CategoryLimit.0.Row');
        await b.tapText(ctx, 'Remove');
        await b.expectId(ctx, 'BudgetSetup.SaveButton', 3_000);
        await b.tapId(ctx, 'BudgetSetup.SaveButton');
        await b.expectId(ctx, 'BudgetDetails.Screen', 3_000);
        await b.expectId(ctx, 'BudgetDetails.CategoryRow.42');
        await b.expectNoId(ctx, 'BudgetDetails.CategoryRow.11');

        await bu.openEditBudget(ctx);
        await bu.addCategoryLimitWithAmount(ctx, 'Groceries', 3, '300');
        await b.expectId(ctx, 'BudgetSetup.SaveButton', 3_000);
        await b.tapId(ctx, 'BudgetSetup.SaveButton');
        await b.expectId(ctx, 'BudgetDetails.CategoryRow.11', 3_000);
    });

    await b.phase('settings: manage, push and widget switches', async () => {
        await budgetSettings();
        await b.expectId(ctx, 'SettingsPage.BudgetManagementCard', 3_000);
        await b.tapId(ctx, 'SettingsPage.BudgetManagementCard');
        await expect(editBudget).toBeVisible({ timeout: 3_000 });
        await b.expectNoId(ctx, 'BudgetCreate.Template.Generic');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'SettingsPage.Container', 3_000);
        await budgetSettings();
        await toggle('SettingsPage.BudgetPushSwitch', '0', '1');
        await toggle('SettingsPage.BudgetPushSwitch', '1', '0');
        await toggle('SettingsPage.BudgetWidgetSwitch', '1', '0');
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'TabBar.Home', 3_000);
        await b.expectNoId(ctx, 'BudgetWidget.Card');
        await b.expectNoId(ctx, 'BudgetWidget.EmptyState');
        await budgetSettings();
        await toggle('SettingsPage.BudgetWidgetSwitch', '0', '1');
        await b.tapId(ctx, 'TabBar.Home');
        await b.expectId(ctx, 'BudgetWidget.Card', 3_000);
    });

    await b.phase('delete budget', async () => {
        await openBudgetCard();
        await bu.openEditBudget(ctx);
        await scrollAbove(ctx, 'BudgetSetup.DeleteButton', b.byId(screen, 'BudgetSetup.SaveButton'));
        await b.tapId(ctx, 'BudgetSetup.DeleteButton');
        await expect(b.byText(screen, 'Delete budget?')).toBeVisible({ timeout: 3_000 });
        await screen.getByText('Delete').last().tap();
        await b.expectNoId(ctx, 'BudgetWidget.Card');
        await b.expectId(ctx, 'BudgetWidget.EmptyState', 3_000);
    });

    await b.phase('over-allocated category limits block saving', async () => {
        await b.tapId(ctx, 'BudgetWidget.EmptyState');
        await bu.chooseEmptyCanvas(ctx);
        await bu.setOverallLimit(ctx, '100');
        await bu.addCategoryLimitWithAmount(ctx, 'Groceries', 0, '150');
        await b.expectId(ctx, 'BudgetSetup.AllocationSummary.OverBy', 3_000);
        await b.expectId(ctx, 'BudgetSetup.SaveButton', 3_000);
        await b.tapId(ctx, 'BudgetSetup.SaveButton');
        await b.sleep(400);
        await expect(b.byText(screen, 'Create budget')).toBeVisible();
        await b.expectNoId(ctx, 'BudgetWidget.Card');
        await bu.fillAmount(ctx, 'BudgetSetup.CategoryLimit.0.AmountInput', '80');
        await b.tapText(ctx, 'Category limits');
        await b.expectNoId(ctx, 'BudgetSetup.AllocationSummary.OverBy');
        await b.expectId(ctx, 'BudgetSetup.SaveButton', 3_000);
        await b.tapId(ctx, 'BudgetSetup.SaveButton');
        await b.expectId(ctx, 'BudgetWidget.Card', 3_000);
        await b.expectId(ctx, 'BudgetWidget.CategoryRow.11');
        await expect(id('BudgetWidget.CategorySpentLabel.11')).toHaveText('13%');
    });
});
