import { expect } from 'e2e';

import * as bu from '../support/budgie/budget.ts';
import * as b from '../support/budgie/core.ts';
import * as r from '../support/budgie/rules.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const COFFEE = 'CategorizeInboxGroupRow.EXPENSE|e2e confident coffee||';

for (const dismissKeyboard of [false, true]) {
    test(
        `48 searched category applies from categorize inbox (${dismissKeyboard ? 'keyboard Done' : 'keyboard open'})`,
        { tags: ['categorize', 'picker'] },
        async ({ budgie }) => {
            const ctx = budgie.ctx;
            await budgie.start({ fixture: 'uncategorized-inbox.db' });
            await t.navigateToTransactions(ctx);
            await b.tapId(ctx, 'UncategorizedTransactionsPill.Button');
            await b.tapId(ctx, COFFEE);
            await b.tapText(ctx, 'More categories');
            await b.fillId(ctx, 'CategoryPickerBottomSheet.Input', 'Grocer');
            if (dismissKeyboard) {
                await b.done(ctx);
            }
            await b.tapId(ctx, 'CategoryPickerBottomSheet.Card.Groceries');
            await b.expectNoId(ctx, 'CategoryPickerBottomSheet.Input', 5_000);
            await expect(b.byId(ctx.screen, 'CategorizeInboxHero.Count')).toHaveText('1');
            await b.expectNoId(ctx, COFFEE);
            await b.tapId(ctx, 'PageHeader.BackButton');
            await b.tapId(ctx, 'TransactionCard.Label.E2E_Confident_Coffee');
            await b.expectId(ctx, 'TransactionInfo.Page');
            await b.expectText(ctx, 'Groceries');
        }
    );
}

test('48 searched category applies to transaction form', { tags: ['picker'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    await budgie.start({ fixture: '25.db' });
    await t.navigateToTransactions(ctx);
    await t.openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
    await t.selectAccount(ctx, 'Rules Test Account');
    await b.tapId(ctx, 'TransactionForm.CategorySelector');
    await b.fillId(ctx, 'CategoryPickerBottomSheet.Input', 'Grocer');
    await b.tapId(ctx, 'CategoryPickerBottomSheet.Card.Groceries');
    await b.expectNoId(ctx, 'CategoryPickerBottomSheet.Input', 5_000);
    await expect(b.byId(ctx.screen, 'TransactionForm.CategorySelector.Title')).toHaveText('Groceries');
});

test('48 searched category applies to rule action', { tags: ['picker', 'rules'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    await budgie.start({ fixture: '25.db' });
    await r.navigateToRules(ctx);
    await r.openCreateRuleForm(ctx);
    await b.tapId(ctx, 'RuleForm.Action.0.CategorySelector');
    await b.fillId(ctx, 'CategoryPickerBottomSheet.Input', 'Grocer');
    await b.tapId(ctx, 'CategoryPickerBottomSheet.Card.Groceries');
    await b.expectNoId(ctx, 'CategoryPickerBottomSheet.Input', 5_000);
    await expect(b.byId(ctx.screen, 'RuleForm.Action.0.CategorySelector.Value')).toHaveText('Groceries');
});

test('48 searched category applies to budget limit', { tags: ['picker', 'budget'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    await budgie.start({ fixture: 'budget-base.db', wait: 'tabbar' });
    await bu.openEmptyBudget(ctx);
    await bu.chooseEmptyCanvas(ctx);
    await b.scrollTo(ctx, 'BudgetSetup.CategoryLimitAddButton');
    await b.tapId(ctx, 'BudgetSetup.CategoryLimitAddButton');
    await b.fillId(ctx, 'CategoryPickerBottomSheet.Input', 'Grocer');
    await b.tapId(ctx, 'CategoryPickerBottomSheet.Card.Groceries');
    await b.expectNoId(ctx, 'CategoryPickerBottomSheet.Input', 5_000);
    await b.expectId(ctx, 'BudgetSetup.CategoryLimit.0.Row');
    await b.expectText(ctx, 'Groceries');
});

test('48 shared account and tag pickers apply selections', { tags: ['picker'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    await budgie.start({ fixture: '25.db' });
    await t.navigateToTransactions(ctx);
    await t.openTransactionForm(ctx, 'ActionItem.Expense', 'New Expense');
    await b.tapId(ctx, 'TransactionForm.AccountSelector');
    await b.fillId(ctx, 'AccountPickerBottomSheet.Input', 'Rules Test');
    await b.tapId(ctx, 'AccountPickerBottomSheet.Option.Rules Test Account');
    await b.expectNoId(ctx, 'AccountPickerBottomSheet.Input', 5_000);
    await expect(b.byId(ctx.screen, 'TransactionForm.SelectedAccount.Rules_Test_Account')).toHaveText('Rules Test Account');
    await b.tapId(ctx, 'TransactionForm.TagsSelector');
    await b.fillId(ctx, 'TagPickerBottomSheet.Input', 'Rules Test Tag');
    await b.tapId(ctx, 'TagPickerBottomSheet.Card.Rules Test Tag');
    await b.tapId(ctx, 'tags-selector-modal-done-button');
    await b.expectNoId(ctx, 'TagPickerBottomSheet.Input', 5_000);
    await expect(b.byId(ctx.screen, 'TransactionForm.TagsSelector.Title')).toHaveText(/Rules\sTest\sTag/u);
});
