import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import * as r from '../support/budgie/rules.ts';
import { selectTagBySearch } from '../support/budgie/tags.ts';
import { test } from '../support/budgie/test.ts';
import { createExpense, navigateToTransactions } from '../support/budgie/transactions.ts';

const ACCOUNT = 'Rules Test Account';
const CATEGORY = 'Rules Test Category';
const TAG = 'Rules Test Tag';

test('26 rules application', { tags: ['rules'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const commentRule = async (value: string) => {
        await r.openCreateRuleForm(ctx);
        await r.pick(ctx, 'RuleForm.Condition.0.FieldSelector.Value', 'COMMENT');
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', value);
        await b.done(ctx);
    };
    const category = async (index = 0) => {
        await b.tapId(ctx, `RuleForm.Action.${index}.CategorySelector`);
        await b.selectCategoryBySearch(ctx, CATEGORY);
    };
    const deleteRule = async () => {
        await r.navigateToRules(ctx);
        await r.deleteFirstRuleViaForm(ctx);
        await r.expectNoRules(ctx);
    };
    const expectExpenseInfo = async (link: string, comment: string) => {
        await b.openLink(ctx, link);
        await b.expectId(ctx, 'TransactionInfo.Page', 10_000);
        await b.expectNoId(ctx, 'TransactionInfo.Row.Note');
        await expect(b.byText(screen, comment)).toBeVisible();
        await b.expectId(ctx, 'TransactionInfo.Row.Category');
        await expect(b.byText(screen, 'Other')).toBeVisible();
    };

    // setup/setup-rules-test
    await budgie.start({ fixture: '25.db' });
    await b.phase('navigate to rules', () => r.navigateToRules(ctx));

    await b.phase('rule applies category', async () => {
        await commentRule('Netflix');
        await category();
        await r.submitRuleApplyExisting(ctx);
        await b.expectId(ctx, 'RulesPage.RuleCard.0');
        await navigateToTransactions(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.Netflix_Subscription');
        await b.expectId(ctx, 'TransactionCard.Category.Rules_Test_Category');
        await deleteRule();
    });

    await b.phase('rule applies tag', async () => {
        await commentRule('Starbucks');
        await r.pick(ctx, 'RuleForm.Action.0.TypeSelector', 'ADD_TAG');
        await b.tapId(ctx, 'RuleForm.Action.0.TagSelector');
        await selectTagBySearch(ctx, TAG);
        await r.submitRuleApplyExisting(ctx);
        await b.expectId(ctx, 'RulesPage.RuleCard.0');
        await navigateToTransactions(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.Starbucks_Coffee');
        await r.assertTransactionTagged(ctx, 'Starbucks_Coffee', TAG);
        await deleteRule();
    });

    await b.phase('rule applies multiple actions', async () => {
        await commentRule('Amazon');
        await category();
        await b.tapId(ctx, 'RuleForm.ActionSection.AddButton');
        await r.pick(ctx, 'RuleForm.Action.1.TypeSelector', 'ADD_TAG');
        await b.scrollTo(ctx, 'RuleForm.Action.1.TagSelector');
        await b.tapId(ctx, 'RuleForm.Action.1.TagSelector');
        await selectTagBySearch(ctx, TAG);
        await r.submitRuleApplyExisting(ctx);
        await r.expectRuleCard(ctx);
        await navigateToTransactions(ctx);
        await b.expectId(ctx, 'TransactionCard.Category.Rules_Test_Category');
        await b.expectId(ctx, 'TransactionCard.Label.Amazon_Purchase');
        await r.assertTransactionTagged(ctx, 'Amazon_Purchase', TAG);
        await deleteRule();
    });

    await b.phase('apply to existing on re-save', async () => {
        await commentRule('Spotify');
        await category();
        await r.submitRuleSkipExisting(ctx);
        await b.expectId(ctx, 'RulesPage.RuleCard.0');
        await navigateToTransactions(ctx);
        await b.expectId(ctx, 'TransactionCard.Label.Spotify_Premium');
        await r.navigateToRules(ctx);
        await b.tapUntil(ctx, 'RulesPage.RuleCardActions.0', () => expect(b.byText(screen, 'Edit Rule')).toBeVisible({ timeout: 5_000 }));
        await r.submitRuleApplyExisting(ctx);
        await navigateToTransactions(ctx);
        await b.expectId(ctx, 'TransactionCard.Category.Rules_Test_Category');
        await deleteRule();
    });

    await b.phase('disabled rule not applied', async () => {
        await r.openCreateRuleForm(ctx);
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Uber');
        await b.done(ctx);
        await category();
        await b.tapId(ctx, 'RuleForm.Footer.SubmitButton');
        await b.expectId(ctx, 'RulesPage.RuleCard.0');
        await b.tapId(ctx, 'RulesPage.RuleCardEnabledSwitch.0');
        await expect(b.byId(ctx.screen, 'RulesPage.RuleCardEnabledSwitch.0')).toBeChecked({ checked: false });
        await createExpense(ctx, { amount: '25', account: ACCOUNT, category: 'Other', comment: 'Uber Ride' });
        await expectExpenseInfo('budgie://transactions/9/expense', 'Uber Ride');
        await deleteRule();
    });

    await b.phase('rule not applied when condition does not match', async () => {
        await r.openCreateRuleForm(ctx);
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Netflix');
        await b.done(ctx);
        await category();
        await r.submitRuleSkipExisting(ctx);
        await b.expectId(ctx, 'RulesPage.RuleCard.0');
        await createExpense(ctx, { amount: '10', account: ACCOUNT, category: 'Other', comment: 'Random Purchase' });
        await expectExpenseInfo('budgie://transactions/10/expense', 'Random Purchase');
        await deleteRule();
    });
});
