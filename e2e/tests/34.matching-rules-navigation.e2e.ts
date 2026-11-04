import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';

test('34 matching rules navigation', { tags: ['rules'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const { screen } = ctx;
    const openTransaction = async (link: string) => {
        await b.openLink(ctx, link);
        await b.expectId(ctx, 'TransactionInfo.Page', 10_000);
        await b.expectId(ctx, 'MatchingRules.Pill', 10_000);
    };

    await budgie.start({ fixture: '34-matching-rules.db' });

    await b.phase('single matching rule opens the rule', async () => {
        await openTransaction('budgie://transactions/10/expense');
        await b.tapUntil(ctx, 'MatchingRules.Pill', () => expect(b.byText(screen, 'Edit Rule')).toBeVisible());
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TransactionInfo.Page');
        await b.tapId(ctx, 'PageHeader.BackButton');
    });

    await b.phase('two matching rules open the filtered list', async () => {
        await openTransaction('budgie://transactions/9/expense');
        await b.tapUntil(ctx, 'MatchingRules.Pill', () => b.expectId(ctx, 'RulesPage.MatchingRulesFilter', 10_000));
        await expect(b.byText(screen, '2 matching rules')).toBeVisible();
        await b.expectId(ctx, 'RulesPage.RuleCard.0');
        await b.expectId(ctx, 'RulesPage.RuleCard.1');
        await b.tapUntil(ctx, 'RulesPage.RuleCard.0', () => expect(b.byText(screen, 'Edit Rule')).toBeVisible());
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'RulesPage.MatchingRulesFilter');
        await b.tapId(ctx, 'PageHeader.BackButton');
        await b.expectId(ctx, 'TransactionInfo.Page');
    });
});
