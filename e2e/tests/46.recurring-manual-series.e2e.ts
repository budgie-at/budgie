import { expect } from 'e2e';

import * as bu from '../support/budgie/budget.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const ROW = 'RecurringPane.Row.E2E_Manual_Netflix';

test('46 recurring manual series', { tags: ['recurring'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '20.db' });

    await b.phase('create a monthly series in the form', async () => {
        await b.openLink(ctx, 'budgie://recurring/create');
        await b.expectId(ctx, 'RecurringForm.Page', 10_000);
        await bu.fillAmount(ctx, 'RecurringForm.Amount', '15');
        await b.fillId(ctx, 'RecurringForm.Title', 'E2E Manual Netflix');
        await b.done(ctx);
        await b.tapId(ctx, 'RecurringForm.Repeat.MONTHLY');
        await b.tapId(ctx, 'RecurringForm.Save');
        await b.expectId(ctx, 'RecurringDetail.Page', 10_000);
    });

    await b.phase('series is listed with its next date', async () => {
        await t.navigateToTransactions(ctx);
        await b.tapId(ctx, 'TransactionsPage.Tab.Recurring');
        await b.expectId(ctx, ROW, 10_000);
        await expect(b.byId(ctx.screen, ROW)).toHaveText(/E2E Manual Netflix[\s\S]*Monthly · next /u);
    });

    await b.phase('open the series detail', async () => {
        await b.tapId(ctx, ROW);
        await b.expectId(ctx, 'RecurringDetail.Page', 10_000);
        await b.expectId(ctx, 'RecurringDetail.Amount');
    });
});
