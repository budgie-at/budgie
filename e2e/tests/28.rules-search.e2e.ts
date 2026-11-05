import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import * as r from '../support/budgie/rules.ts';
import { test } from '../support/budgie/test.ts';

const CATEGORY = 'Rules Test Category';

test('28 rules search', { tags: ['rules'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const id = (testId: string) => b.byId(screen, testId);
    const createRule = async (value: string) => {
        await r.openCreateRuleForm(ctx);
        await b.fillId(ctx, 'RuleForm.Condition.0.ValueInput', value);
        await b.done(ctx);
        await r.openActionCategorySelector(ctx, 0);
        await b.selectCategoryBySearch(ctx, CATEGORY);
        await b.tapId(ctx, 'RuleForm.Footer.SubmitButton');
        await b.expectId(ctx, 'RulesPage.Page');
    };

    // setup/setup-rules-test
    await budgie.start({ fixture: '25.db' });
    await b.phase('navigate to rules', () => r.navigateToRules(ctx));

    await b.phase('create two rules', async () => {
        await createRule('Toolsense');
        await r.expectRuleCard(ctx);
        await createRule('Tango office loan service new salary entry');
        await b.expectId(ctx, 'RulesPage.RuleCard.0');
        await b.expectId(ctx, 'RulesPage.RuleCard.1');
    });

    await b.phase('search', async () => {
        const search = id('RulesPage.SearchInput');
        await search.fill('Toolsense');
        await b.expectId(ctx, 'RulesPage.RuleCard.0');
        await b.expectId(ctx, 'RulesPage.RuleCardConditions.0');
        await b.expectNoId(ctx, 'RulesPage.RuleCard.1');

        await search.fill(CATEGORY);
        await b.expectId(ctx, 'RulesPage.RuleCard.0');
        await b.expectId(ctx, 'RulesPage.RuleCardActions.0');
        await b.expectId(ctx, 'RulesPage.RuleCard.1');

        await search.fill('MissingRuleSearch');
        await b.expectId(ctx, 'RulesPage.EmptyState');
        await expect(b.byText(screen, /^No rules match/i)).toBeVisible();
        await expect(b.byText(screen, 'Try a title, category or tag name.')).toBeVisible();

        await search.clear();
        await b.expectId(ctx, 'RulesPage.RuleCard.0');
    });

    await b.phase('delete via form', async () => {
        await r.deleteFirstRuleViaForm(ctx);
        await r.deleteFirstRuleViaForm(ctx);
        await r.expectNoRules(ctx);
    });
});
