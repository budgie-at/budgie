import * as c from '../support/budgie/categories.ts';
import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

const ROW = 'RecurringPane.Row.E2E_Recurring_Rent';

test('46 recurring not recurring undo', { tags: ['recurring'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;

    await budgie.start({ fixture: '20.db' });

    await b.phase('open the recurring list', async () => {
        await t.navigateToTransactions(ctx);
        await b.tapId(ctx, 'TransactionsPage.Tab.Recurring');
        await b.expectId(ctx, ROW, 10_000);
    });

    await b.phase('swipe a detected series to not recurring', async () => {
        await c.swipeRowToDelete(ctx, ROW);
        await b.expectNoId(ctx, ROW, 10_000);
        await b.expectId(ctx, 'AppToast.ActionButton', 5_000);
    });

    await b.phase('undo restores the row', async () => {
        await b.tapId(ctx, 'AppToast.ActionButton');
        await b.expectId(ctx, ROW, 10_000);
    });
});
