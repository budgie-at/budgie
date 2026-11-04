import * as b from '../support/budgie/core.ts';
import { importTestTransactions } from '../support/budgie/imports.ts';
import * as r from '../support/budgie/rules.ts';
import { selectTagBySearch } from '../support/budgie/tags.ts';
import { test } from '../support/budgie/test.ts';

test('26 rules import application', { tags: ['rules'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    // setup/setup-rules-test
    await budgie.start({ fixture: '25.db' });
    await b.phase('navigate to rules', () => r.navigateToRules(ctx));

    await b.phase('create set-category rule', async () => {
        await r.openCreateRuleForm(ctx);
        await r.pick(ctx, 'RuleForm.Condition.0.FieldSelector.Value', 'COMMENT');
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Netflix');
        await b.done(ctx);
        await r.pick(ctx, 'RuleForm.Action.0.TypeSelector', 'SET_CATEGORY');
        await b.scrollTo(ctx, 'RuleForm.Action.0.CategorySelector');
        await b.tapId(ctx, 'RuleForm.Action.0.CategorySelector');
        await b.selectCategoryBySearch(ctx, 'Groceries');
        await r.submitRuleSkipExisting(ctx);
        await b.expectId(ctx, 'RulesPage.RuleCard.0');
    });

    await b.phase('create add-tag rule', async () => {
        await r.openCreateRuleForm(ctx);
        await r.pick(ctx, 'RuleForm.Condition.0.FieldSelector.Value', 'COMMENT');
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Starbucks');
        await b.done(ctx);
        await r.pick(ctx, 'RuleForm.Action.0.TypeSelector', 'ADD_TAG');
        await b.tapId(ctx, 'RuleForm.Action.0.TagSelector');
        await selectTagBySearch(ctx, 'Subscription');
        await r.submitRuleSkipExisting(ctx);
        await b.expectId(ctx, 'RulesPage.RuleCard.1');
    });

    await b.phase('import applies the rules', async () => {
        await importTestTransactions(ctx, await budgie.csvFixturesUri(), 'test16-rules-import');
        await b.tapId(ctx, 'TabBar.Transactions');
        await b.expectId(ctx, 'TransactionCard.Category.Groceries', 10_000);
        await b.expectId(ctx, 'TransactionCard.Label.Starbucks_Coffee', 10_000);
        await r.assertTransactionTagged(ctx, 'Starbucks_Coffee', 'Subscription');
    });

    await b.phase('delete rules', async () => {
        await r.navigateToRules(ctx);
        await r.deleteFirstRule(ctx);
        await r.deleteFirstRule(ctx);
        await r.expectNoRules(ctx);
    });
});
