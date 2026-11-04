// Port of tests/app-tests/flows/20.recurring-calendar.flow.yaml.
import { expect } from 'e2e';

import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('20 recurring calendar', { tags: ['recurring'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const id = (testId: string) => b.byId(ctx.screen, testId);
    const expectedIfShown = async () => {
        if (await id('RecurringCalendar.ExpectedHeader').isVisible()) {
            await expect(id('RecurringCalendar.ExpectedHeader')).toBeVisible();
            await expect(id('RecurringCalendar.Row.E2E_Recurring_Gym')).toBeVisible();
            await b.scrollTo(ctx, 'RecurringCalendar.RecordedHeader');
            await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Recurring_Rent');
            await b.scrollTo(ctx, 'RecurringCalendar.MonthLabel', 'up');
        }
    };

    await budgie.start({ fixture: '20.db' });

    await b.phase('open recurring calendar', async () => {
        await t.navigateToTransactions(ctx);
        await b.tapId(ctx, 'TransactionsPage.Tab.Recurring');
        await b.expectId(ctx, 'RecurringCalendar.Container', 5_000);
        await expectedIfShown();
    });

    await b.phase('select and deselect day 19', async () => {
        await b.tapId(ctx, 'RecurringCalendar.Day.CurrentMonth.19');
        await b.expectId(ctx, 'RecurringCalendar.SelectedDayHeader.19', 5_000);
        await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Recurring_Rent');
        await b.tapId(ctx, 'RecurringCalendar.Day.CurrentMonth.19');
        await b.expectNoId(ctx, 'RecurringCalendar.SelectedDayHeader.19', 5_000);
        await b.expectId(ctx, 'RecurringCalendar.Day.CurrentMonth.19');
        await expectedIfShown();
    });

    await b.phase('empty day', async () => {
        await b.tapId(ctx, 'RecurringCalendar.Day.CurrentMonth.1');
        await b.expectId(ctx, 'RecurringCalendar.SelectedDayHeader.1', 5_000);
        await b.expectId(ctx, 'RecurringCalendar.SelectedDayEmptyState');
    });

    await b.phase('previous month', async () => {
        await b.tapId(ctx, 'RecurringCalendar.PreviousMonthButton');
        await b.expectId(ctx, 'RecurringCalendar.RecordedHeader', 5_000);
        await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Recurring_Rent');
        await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Recurring_Gym');
    });
    await b.phase('empty month retains navigation', async () => {
        for (let month = 0; month < 3; month += 1) {
            await b.tapId(ctx, 'RecurringCalendar.PreviousMonthButton');
        }
        await b.scrollTo(ctx, 'RecurringCalendar.EmptyMonth');
        await b.expectId(ctx, 'RecurringCalendar.EmptyMonth');
        await b.scrollTo(ctx, 'RecurringCalendar.MonthLabel', 'up');
        await b.expectId(ctx, 'RecurringCalendar.NextMonthButton');
        for (let month = 0; month < 3; month += 1) {
            await b.tapId(ctx, 'RecurringCalendar.NextMonthButton');
        }
        await b.scrollTo(ctx, 'RecurringCalendar.Row.E2E_Recurring_Rent');
        await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Recurring_Rent');
    });
    await b.phase('rename recurring series', async () => {
        await b.scrollTo(ctx, 'RecurringCalendar.Row.E2E_Recurring_Rent');
        await id('RecurringCalendar.Row.E2E_Recurring_Rent').longPress();
        await b.tapText(ctx, 'Rename');
        await b.expectId(ctx, 'RecurringCalendar.SeriesTitleInput');
        await b.fillId(ctx, 'RecurringCalendar.SeriesTitleInput', 'E2E Renamed Rent');
        await b.done(ctx);
        await b.expectNoId(ctx, 'RecurringCalendar.SeriesTitleInput');
        await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Renamed_Rent');
    });
});
