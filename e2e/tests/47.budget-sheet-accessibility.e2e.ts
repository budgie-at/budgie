import { mustExec } from '@mobile-ci/e2e-simlock/exec';
import { expect } from 'e2e';

import * as bu from '../support/budgie/budget.ts';
import * as b from '../support/budgie/core.ts';
import { BUNDLE_ID } from '../support/budgie/fixtures.ts';
import { test } from '../support/budgie/test.ts';

test('47 safe to spend remains scrollable at the largest text size', { tags: ['budget'], platforms: ['ios'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    await budgie.start({ fixture: 'budget-base.db', wait: 'tabbar' });
    await bu.openEmptyBudget(ctx);
    await bu.chooseEmptyCanvas(ctx);
    await bu.setOverallLimit(ctx, '1000');
    await bu.saveFromHeader(ctx);
    await b.expectId(ctx, 'BudgetWidget.Card');
    const lease = await budgie.lease();
    let bodyPassed = false;

    try {
        await mustExec(budgie.api, lease, ['ui', 'content_size', 'accessibility-extra-extra-extra-large']);
        await mustExec(budgie.api, lease, ['terminate', BUNDLE_ID]);
        await ctx.app.open();
        await b.openLink(ctx, 'budgie://budget-safe-to-spend');
        const explanation = ctx.screen
            .getByText("Recalculates every day. Spend less today and tomorrow's amount grows.", { exact: true })
            .first();
        await ctx.screen.scrollUntilVisible(explanation, { direction: 'down', timeout: 20_000 });
        await expect(explanation).toBeVisible();
        bodyPassed = true;
    } finally {
        await mustExec(budgie.api, lease, ['ui', 'content_size', 'large']).catch(error => {
            if (bodyPassed) {
                throw error;
            }

            console.log(`[cleanup] restoring the content size failed: ${String(error)}`);
        });
    }
});
