import { PRECISION, RecurringSeriesKindEnum, RecurringSeriesUserStateEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { RecurringAlertEnum } from '../src/enum/recurring-alert.enum';
import { projectRecurringMonth } from '../src/series/recurring-projection';
import { detectRecurringSeries } from '../src/series/recurring-series';

import type { RecurringChargeInterface } from '../src/interface/recurring-charge.interface';

const charge = (day: number, title = 'NETFLIX', nativeAmount = 12, kind = RecurringSeriesKindEnum.EXPENSE): RecurringChargeInterface => ({
    transactionId: day,
    operatedAt: new Date(2026, 0, day, 12),
    title,
    comment: '',
    defaultAmount: nativeAmount * PRECISION,
    nativeAmount: nativeAmount * PRECISION,
    instrumentId: 1,
    counterpartyIban: null,
    mccCategoryId: null,
    kind,
    accountId: 1,
    categoryId: null,
    categoryTitle: null,
    categoryIcon: null
});

const calendarFromCharges = (charges: readonly RecurringChargeInterface[], now: Date) =>
    projectRecurringMonth(
        detectRecurringSeries(charges).map((item, index) => ({
            ...item,
            seriesId: index + 1,
            userState: RecurringSeriesUserStateEnum.SUGGESTED
        })),
        now.getFullYear(),
        now.getMonth(),
        now
    );

it.effect('omits income from a mixed recurring day and expense totals', () =>
    Effect.sync(() => {
        const data = calendarFromCharges(
            [5, 36, 64, 95].flatMap(day => [charge(day, 'TRANSIT', 83.4), charge(day, 'SALARY', 677.43, RecurringSeriesKindEnum.INCOME)]),
            new Date(2026, 4, 5, 12)
        );
        expect(data.forecastedEntriesByDay.get(5)?.map(entry => entry.title)).toEqual(['TRANSIT']);
        expect(data.forecastedTotalAmount).toBe(83.4);
        expect(data.committedMonthlyExpense).toBe(83.4);
    })
);

it.effect('omits a previously tracked income series from projection', () =>
    Effect.sync(() => {
        const [expense] = detectRecurringSeries([5, 36, 64, 95].map(day => charge(day)));
        const data = projectRecurringMonth(
            [
                { ...expense, seriesId: 1, userState: RecurringSeriesUserStateEnum.SUGGESTED },
                { ...expense, kind: RecurringSeriesKindEnum.INCOME, seriesId: 2, userState: RecurringSeriesUserStateEnum.CONFIRMED }
            ],
            2026,
            4,
            new Date(2026, 4, 5, 12)
        );
        expect(data.forecastedEntriesByDay.get(5)).toHaveLength(1);
        expect(data.committedMonthlyExpense).toBe(12);
    })
);

it.effect('excludes overdue expense forecasts from the monthly headline', () =>
    Effect.sync(() => {
        const data = calendarFromCharges(
            [5, 36, 64, 95].map(day => charge(day)),
            new Date(2026, 4, 12)
        );
        expect(data.forecastedEntriesByDay.get(5)?.[0].alert).toBe(RecurringAlertEnum.OVERDUE);
        expect(data.forecastedTotalAmount).toBe(0);
    })
);

it.effect('counts a due-today forecast and excludes yesterday during the overdue grace', () =>
    Effect.sync(() => {
        const charges = [5, 36, 64, 95].map(day => charge(day));
        const today = calendarFromCharges(charges, new Date(2026, 4, 5, 12));
        const yesterday = calendarFromCharges(charges, new Date(2026, 4, 6, 12));
        expect(today.forecastedTotalAmount).toBe(12);
        expect(yesterday.forecastedTotalAmount).toBe(0);
        expect(yesterday.forecastedEntriesByDay.get(5)?.[0].alert).toBeNull();
    })
);

it.effect('drops stale streams from future forecasts and monthly commitment', () =>
    Effect.sync(() => {
        const data = calendarFromCharges(
            [5, 36, 64, 95].map(day => charge(day)),
            new Date(2026, 4, 25)
        );
        expect(data.forecastedEntriesByDay.size).toBe(0);
        expect(data.committedMonthlyExpense).toBe(0);
    })
);
