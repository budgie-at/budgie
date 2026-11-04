import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('20 recurring calendar', { tags: ['recurring'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const id = (testId: string) => b.byId(ctx.screen, testId);
    const upcomingIfShown = async () => {
        if (await id('RecurringCalendar.UpcomingHeader').isVisible()) {
            await expect(id('RecurringCalendar.UpcomingHeader')).toBeVisible();
            await expect(id('RecurringCalendar.Row.E2E_Recurring_Gym')).toBeVisible();
        }
    };

    await budgie.start({ fixture: '20.db' });

    await b.phase('open recurring calendar', async () => {
        await t.navigateToTransactions(ctx);
        await b.tapId(ctx, 'TransactionsPage.Tab.Recurring');
        await b.expectId(ctx, 'RecurringCalendar.Container', 5_000);
        await upcomingIfShown();
    });

    await b.phase('select and deselect day 19', async () => {
        await b.tapId(ctx, 'RecurringCalendar.Day.CurrentMonth.19');
        await b.expectId(ctx, 'RecurringCalendar.SelectedDayHeader.19', 5_000);
        await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Recurring_Rent');
        await b.tapId(ctx, 'RecurringCalendar.Day.CurrentMonth.19');
        await b.expectNoId(ctx, 'RecurringCalendar.SelectedDayHeader.19', 5_000);
        await b.expectId(ctx, 'RecurringCalendar.Day.CurrentMonth.19');
        await upcomingIfShown();
    });

    await b.phase('empty day', async () => {
        await b.tapId(ctx, 'RecurringCalendar.Day.CurrentMonth.1');
        await b.expectId(ctx, 'RecurringCalendar.SelectedDayHeader.1', 5_000);
        await b.expectId(ctx, 'RecurringCalendar.SelectedDayEmptyState');
    });

    await b.phase('previous month', async () => {
        await b.tapId(ctx, 'RecurringCalendar.PreviousMonthButton');
        await b.expectId(ctx, 'RecurringCalendar.AllRecurringHeader', 5_000);
        await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Recurring_Rent');
        await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Recurring_Gym');
    });
});
