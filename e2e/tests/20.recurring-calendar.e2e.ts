import * as b from '../support/budgie/core.ts';
import { test } from '../support/budgie/test.ts';
import * as t from '../support/budgie/transactions.ts';

test('20 recurring calendar', { tags: ['recurring'] }, async ({ budgie }) => {
    const ctx = budgie.ctx;
    const expectExpectedAndRecordedRows = async () => {
        await b.expectId(ctx, 'RecurringCalendar.ExpectedHeader', 5_000);
        await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Recurring_Gym');
        await b.scrollTo(ctx, 'RecurringCalendar.RecordedHeader');
        await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Recurring_Rent');
        await b.scrollTo(ctx, 'RecurringCalendar.MonthLabel', 'up');
    };

    await budgie.start({ fixture: '20.db' });

    await b.phase('open recurring calendar', async () => {
        await t.navigateToTransactions(ctx);
        await b.tapId(ctx, 'TransactionsPage.Tab.Recurring');
        await b.expectId(ctx, 'RecurringPane.List', 5_000);
        await b.tapId(ctx, 'RecurringPane.ViewToggleButton');
        await b.expectId(ctx, 'RecurringCalendar.Container', 5_000);
        await expectExpectedAndRecordedRows();
    });

    await b.phase('select and deselect day 19', async () => {
        await b.tapId(ctx, 'RecurringCalendar.Day.CurrentMonth.19');
        await b.expectId(ctx, 'RecurringCalendar.SelectedDayHeader.19', 5_000);
        await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Recurring_Rent');
        await b.tapId(ctx, 'RecurringCalendar.Day.CurrentMonth.19');
        await b.expectNoId(ctx, 'RecurringCalendar.SelectedDayHeader.19', 5_000);
        await b.expectId(ctx, 'RecurringCalendar.Day.CurrentMonth.19');
        await expectExpectedAndRecordedRows();
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
        for (let month = 0; month < 4; month += 1) {
            await b.tapId(ctx, 'RecurringCalendar.PreviousMonthButton');
        }
        await b.scrollTo(ctx, 'RecurringCalendar.EmptyMonth');
        await b.expectId(ctx, 'RecurringCalendar.EmptyMonth');
        await b.scrollTo(ctx, 'RecurringCalendar.MonthLabel', 'up');
        await b.expectId(ctx, 'RecurringCalendar.NextMonthButton');
        for (let month = 0; month < 4; month += 1) {
            await b.tapId(ctx, 'RecurringCalendar.NextMonthButton');
        }
        await b.scrollTo(ctx, 'RecurringCalendar.Row.E2E_Recurring_Rent');
        await b.expectId(ctx, 'RecurringCalendar.Row.E2E_Recurring_Rent');
    });
    await b.phase('list view rows and series detail', async () => {
        await b.tapId(ctx, 'RecurringPane.ViewToggleButton');
        await b.expectId(ctx, 'RecurringPane.List', 5_000);
        await b.expectId(ctx, 'RecurringPane.Row.E2E_Recurring_Rent');
        await b.expectId(ctx, 'RecurringPane.Row.E2E_Recurring_Gym');
        await b.tapId(ctx, 'RecurringPane.Row.E2E_Recurring_Rent');
        await b.expectId(ctx, 'RecurringDetail.Page', 5_000);
    });
});
