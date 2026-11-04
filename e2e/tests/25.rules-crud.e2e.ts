import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import * as r from '../support/budgie/rules.ts';
import { test } from '../support/budgie/test.ts';

const ACCOUNT = 'Rules Test Account';
const CATEGORY = 'Rules Test Category';
const TAG = 'Rules Test Tag';

test('25 rules CRUD', { tags: ['rules'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const category = async () => {
        await b.tapId(ctx, 'RuleForm.Action.0.CategorySelector');
        await b.selectCategoryBySearch(ctx, CATEGORY);
    };

    // setup/setup-rules-test: the 25.db fixture, imported (seeded), then relaunched.
    await budgie.start({ fixture: '25.db' });
    await b.phase('navigate to rules', () => r.navigateToRules(ctx));

    await b.phase('create basic rule', async () => {
        await r.openCreateRuleForm(ctx);
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Netflix');
        await b.done(ctx);
        await category();
        await r.submitRuleSkipExisting(ctx);
        await r.expectRuleCard(ctx);
    });

    await b.phase('edit rule', async () => {
        await b.tapUntil(ctx, 'RulesPage.RuleCard.0', () => expect(screen.getByText('Edit Rule').first()).toBeVisible({ timeout: 5_000 }));
        await id('RuleForm.Condition.0.ValueInput').clear();
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Netflix Updated');
        await b.done(ctx);
        await b.tapId(ctx, 'RuleForm.Footer.SubmitButton');
        await r.expectRuleCard(ctx);
    });

    await b.phase('toggle enabled', async () => {
        await b.tapId(ctx, 'RulesPage.RuleCardEnabledSwitch.0');
        await b.tapId(ctx, 'RulesPage.RuleCardEnabledSwitch.0');
        await r.expectRuleCard(ctx, 0, false);
    });

    await b.phase('delete rule, empty state', async () => {
        await r.deleteFirstRule(ctx);
        await r.expectNoRules(ctx);
        await expect(screen.getByText('Rules work on imported transactions').first()).toBeVisible();
        await expect(
            screen
                .getByText('Connect a bank or import a statement first, then rules can categorise and tag every transaction as it arrives.')
                .first()
        ).toBeVisible();
    });

    await b.phase('multiple conditions', async () => {
        await r.openCreateRuleForm(ctx);
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Spotify');
        await b.tapId(ctx, 'RuleForm.ConditionSection.AddButton');
        await r.pick(ctx, 'RuleForm.Condition.1.FieldSelector', 'COMMENT');
        await b.fillId(ctx, 'RuleForm.Condition.1.ValueInput', 'Premium');
        await b.done(ctx);
        await expect(screen.getByText('All conditions').first()).toBeVisible();
        await b.scrollTo(ctx, 'RuleForm.Action.0.CategorySelector');
        await category();
        await r.submitRuleSkipExisting(ctx);
        await r.expectRuleCard(ctx);
        await r.deleteFirstRule(ctx);
        await r.expectNoRules(ctx);
    });

    await b.phase('multiple actions', async () => {
        await r.openCreateRuleForm(ctx);
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Amazon');
        await b.done(ctx);
        await category();
        await b.tapId(ctx, 'RuleForm.ActionSection.AddButton');
        await r.pick(ctx, 'RuleForm.Action.1.TypeSelector', 'ADD_TAG');
        await b.scrollTo(ctx, 'RuleForm.Action.1.TagSelector');
        await b.tapId(ctx, 'RuleForm.Action.1.TagSelector');
        await screen.getByText(TAG).first().tap();
        await r.submitRuleSkipExisting(ctx);
        await r.expectRuleCard(ctx);
        await r.deleteFirstRule(ctx);
        await r.expectNoRules(ctx);
    });

    await b.phase('remove condition and action', async () => {
        await r.openCreateRuleForm(ctx);
        await b.tapId(ctx, 'RuleForm.ConditionSection.AddButton');
        await expect(id('RuleForm.Condition.1.FieldSelector')).toBeVisible();
        await b.tapId(ctx, 'RuleForm.Condition.1.RemoveButton');
        await expect(id('RuleForm.Condition.1.FieldSelector')).toBeHidden();
        await b.tapId(ctx, 'RuleForm.ActionSection.AddButton');
        await expect(id('RuleForm.Action.1.TypeSelector')).toBeVisible();
        await b.tapId(ctx, 'RuleForm.Action.1.RemoveButton');
        await expect(id('RuleForm.Action.1.TypeSelector')).toBeHidden();
        await b.scrollTo(ctx, 'RuleForm.Condition.0.ValueInput', 'up');
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'TestRemove');
        await b.done(ctx);
        await category();
        await b.tapId(ctx, 'RuleForm.Footer.SubmitButton');
        await expect(id('RulesPage.Page')).toBeVisible();
        await r.expectRuleCard(ctx);
        await r.deleteFirstRule(ctx);
        await r.expectNoRules(ctx);
    });

    await b.phase('amount GREATER_THAN + comment', async () => {
        await r.openCreateRuleForm(ctx);
        await r.pick(ctx, 'RuleForm.Condition.0.FieldSelector.Value', 'AMOUNT');
        await r.pick(ctx, 'RuleForm.Condition.0.OperatorSelector', 'GREATER_THAN');
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', '100');
        await b.tapId(ctx, 'RuleForm.ConditionSection.AddButton');
        await r.pick(ctx, 'RuleForm.Condition.1.FieldSelector', 'COMMENT');
        await b.fillId(ctx, 'RuleForm.Condition.1.ValueInput', 'Test08 Comment');
        await id('RuleForm.Condition.1.ValueInput').press('Enter');
        await b.scrollTo(ctx, 'RuleForm.Action.0.TypeSelector');
        await r.pick(ctx, 'RuleForm.Action.0.TypeSelector', 'SET_CATEGORY');
        await b.scrollTo(ctx, 'RuleForm.Action.0.CategorySelector');
        await category();
        await b.tapId(ctx, 'RuleForm.Footer.SubmitButton');
        await r.expectRuleCard(ctx);
        await r.deleteFirstRule(ctx);
        await r.expectNoRules(ctx);
    });

    await b.phase('account + transaction type', async () => {
        await r.openCreateRuleForm(ctx);
        await r.pick(ctx, 'RuleForm.Condition.0.FieldSelector.Value', 'ACCOUNT_ID');
        await expect(id('RuleForm.Condition.0.ValueInput')).toBeVisible();
        await b.tapId(ctx, 'RuleForm.Condition.0.ValueInput');
        await expect(id('AccountPickerBottomSheet.Input')).toBeVisible();
        await b.fillId(ctx, 'AccountPickerBottomSheet.Input', ACCOUNT);
        await expect(id(`AccountPickerBottomSheet.Option.${ACCOUNT}`)).toBeVisible();
        await b.tapId(ctx, `AccountPickerBottomSheet.Option.${ACCOUNT}`);
        await expect(id('AccountPickerBottomSheet.Input')).toBeHidden();
        await b.tapId(ctx, 'RuleForm.ConditionSection.AddButton');
        await r.pick(ctx, 'RuleForm.Condition.1.FieldSelector', 'TRANSACTION_TYPE');
        await expect(id('RuleForm.Condition.1.ValueInput')).toBeVisible();
        await b.tapId(ctx, 'RuleForm.Condition.1.ValueInput');
        await screen.getByText('Expense').last().tap();
        await b.scrollTo(ctx, 'RuleForm.Action.0.CategorySelector');
        await category();
        await r.submitRuleSkipExisting(ctx);
        await r.expectRuleCard(ctx, 0, false);
        await r.deleteFirstRule(ctx);
        await r.expectNoRules(ctx);
    });

    await b.phase('operators EQUALS, NOT_CONTAINS, LESS_THAN', async () => {
        await r.openCreateRuleForm(ctx);
        await r.pick(ctx, 'RuleForm.Condition.0.OperatorSelector', 'EQUALS');
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Exact Match');
        await b.done(ctx);
        await b.scrollTo(ctx, 'RuleForm.Action.0.CategorySelector');
        await category();
        await b.tapId(ctx, 'RuleForm.Footer.SubmitButton');
        await expect(id('RulesPage.Page')).toBeVisible();
        await r.expectRuleCard(ctx, 0, false);

        await r.openCreateRuleForm(ctx);
        await r.pick(ctx, 'RuleForm.Condition.0.FieldSelector.Value', 'COMMENT');
        await r.pick(ctx, 'RuleForm.Condition.0.OperatorSelector', 'NOT_CONTAINS');
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'exclude');
        await b.done(ctx);
        await category();
        await r.submitRuleSkipExisting(ctx);
        await r.expectRuleCard(ctx, 1, false);

        await r.openCreateRuleForm(ctx);
        await r.pick(ctx, 'RuleForm.Condition.0.FieldSelector.Value', 'AMOUNT');
        await r.pick(ctx, 'RuleForm.Condition.0.OperatorSelector', 'LESS_THAN');
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', '50');
        await b.tapId(ctx, 'RuleForm.ConditionSection.Header');
        await b.scrollTo(ctx, 'RuleForm.Action.0.CategorySelector');
        await category();
        await r.submitRuleSkipExisting(ctx);
        await r.expectRuleCard(ctx, 2, false);

        for (let i = 0; i < 3; i++) {
            await r.deleteFirstRule(ctx);
        }
        await r.expectNoRules(ctx);
    });

    await b.phase('BETWEEN', async () => {
        await r.openCreateRuleForm(ctx);
        await r.pick(ctx, 'RuleForm.Condition.0.FieldSelector.Value', 'AMOUNT');
        await r.pick(ctx, 'RuleForm.Condition.0.OperatorSelector', 'BETWEEN');
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', '10');
        await b.tapId(ctx, 'RuleForm.ConditionSection.Header');
        await b.fillId(ctx, 'RuleForm.Condition.0.SecondaryValueInput', '100');
        await b.tapId(ctx, 'RuleForm.ConditionSection.Header');
        await b.scrollTo(ctx, 'RuleForm.Action.0.CategorySelector');
        await category();
        await b.tapId(ctx, 'RuleForm.Footer.SubmitButton');
        await expect(id('RulesPage.Page')).toBeVisible();
        await r.expectRuleCard(ctx, 0, false);
        await r.deleteFirstRule(ctx);
        await r.expectNoRules(ctx);
    });

    await b.phase('external source + MCC', async () => {
        await r.openCreateRuleForm(ctx);
        await r.pick(ctx, 'RuleForm.Condition.0.FieldSelector.Value', 'EXTERNAL_SOURCE');
        await b.tapId(ctx, 'RuleForm.Condition.0.ValueInput');
        await expect(id('RuleForm.SelectorCard.MONOBANK')).toBeVisible({ timeout: 3_000 });
        await b.tapId(ctx, 'RuleForm.SelectorCard.MONOBANK');
        await b.scrollTo(ctx, 'RuleForm.Action.0.CategorySelector');
        await category();
        await b.tapId(ctx, 'RuleForm.Footer.SubmitButton');
        await expect(id('RulesPage.Page')).toBeVisible();
        await r.expectRuleCard(ctx, 0, false);

        await r.openCreateRuleForm(ctx);
        await r.pick(ctx, 'RuleForm.Condition.0.FieldSelector.Value', 'MCC_CODE');
        await b.tapId(ctx, 'RuleForm.Condition.0.ValueInput');
        await b.fillId(ctx, 'RuleMccSelector.SearchInput', '0742');
        await b.done(ctx);
        await expect(id('RuleMccSelector.Card.0742')).toBeVisible({ timeout: 10_000 });
        await b.tapId(ctx, 'RuleMccSelector.Card.0742');
        await b.scrollTo(ctx, 'RuleForm.Action.0.CategorySelector');
        await category();
        await b.tapId(ctx, 'RuleForm.Footer.SubmitButton');
        await expect(id('RulesPage.Page')).toBeVisible();
        await r.expectRuleCard(ctx, 1, false);

        await r.deleteFirstRule(ctx);
        await expect(id('RulesPage.RuleCard.1')).toBeHidden({ timeout: 10_000 });
        await r.deleteFirstRule(ctx);
        await r.expectNoRules(ctx);
    });

    await b.phase('match any, applied to existing transactions', async () => {
        await r.openCreateRuleForm(ctx);
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Spotify');
        await b.done(ctx);
        await category();
        await r.submitRuleApplyExisting(ctx);
        await r.expectRuleCard(ctx, 0, false);
        await b.tapId(ctx, 'TabBar.Transactions');
        await expect(id('TransactionCard.Label.Spotify_Premium')).toBeVisible();
        await expect(id('TransactionCard.Category.Rules_Test_Category')).toBeVisible();
    });
});
