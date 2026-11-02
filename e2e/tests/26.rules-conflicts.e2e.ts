// Port of tests/app-tests/flows/26.rules-conflicts.flow.yaml.
import { expect } from 'e2e';
import * as b from '../support/budgie/core.ts';
import * as r from '../support/budgie/rules.ts';
import { test } from '../support/budgie/test.ts';

const CATEGORY = 'Rules Test Category';

test('26 rules conflicts', { tags: ['rules'] }, async ({ budgie }) => {
  const ctx = budgie.ctx;
  const { screen } = ctx;

  // setup/setup-rules-test
  await budgie.start({ fixture: '25.db' });
  await b.phase('navigate to rules', () => r.navigateToRules(ctx));

  await b.phase('create first rule', async () => {
    await r.openCreateRuleForm(ctx);
    await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Test');
    await b.done(ctx);
    await b.tapId(ctx, 'RuleForm.Action.0.CategorySelector');
    await b.selectCategoryBySearch(ctx, CATEGORY);
    await b.tapId(ctx, 'RuleForm.Footer.SubmitButton');
    await b.expectId(ctx, 'RulesPage.Page');
    await b.expectId(ctx, 'RulesPage.RuleCard.0');
  });

  await b.phase('overlapping rule warns, dismiss', async () => {
    await r.openCreateRuleForm(ctx);
    await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', 'Other');
    await b.done(ctx);
    await expect(b.byText(screen, /^Some transactions may match multiple rules\./)).toBeVisible();
    await r.swipeDownToDismiss(ctx, 'Create Rule');
    await expect(b.byText(screen, 'Create Rule')).toBeHidden();
  });

  await b.phase('delete rule', async () => {
    await r.deleteFirstRule(ctx);
    await r.expectNoRules(ctx);
  });
});
