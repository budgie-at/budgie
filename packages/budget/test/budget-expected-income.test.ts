import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { computeExpectedIncome } from '../src/income/utils/compute-expected-income.util';

import type { BudgetIncomeCalendarEntryInterface } from '../src/income/interface/budget-income-calendar-entry.interface';
import type { BudgetIncomeMonthInterface } from '../src/income/interface/budget-income-month.interface';

const OCTOBER = 9;
const NOVEMBER = 10;

const dayMap = (entries: readonly BudgetIncomeCalendarEntryInterface[]) =>
    entries.reduce(
        (groups, entry) => groups.set(entry.dayOfMonth, [...(groups.get(entry.dayOfMonth) ?? []), entry]),
        new Map<number, BudgetIncomeCalendarEntryInterface[]>()
    );

const month = (
    monthIndex: number,
    posted: readonly BudgetIncomeCalendarEntryInterface[],
    forecasted: readonly BudgetIncomeCalendarEntryInterface[]
): BudgetIncomeMonthInterface => ({
    month: new Date(2026, monthIndex, 1),
    calendar: { entriesByDay: dayMap(posted), forecastedEntriesByDay: dayMap(forecasted) }
});

const WEEK_ACROSS_MONTHS = { periodStart: new Date(2026, OCTOBER, 26), nextPeriodStart: new Date(2026, NOVEMBER, 2) };

it.effect('sums posted and forecasted income inside the window across the months it touches', () =>
    Effect.sync(() => {
        const months = [
            month(
                OCTOBER,
                [{ latestAmount: 20, dayOfMonth: 27 }],
                [
                    { latestAmount: 100, dayOfMonth: 28 },
                    { latestAmount: 7, dayOfMonth: 10 }
                ]
            ),
            month(
                NOVEMBER,
                [],
                [
                    { latestAmount: 50, dayOfMonth: 1 },
                    { latestAmount: 9, dayOfMonth: 5 }
                ]
            )
        ];

        expect(computeExpectedIncome(months, WEEK_ACROSS_MONTHS, 1)).toBe(170);
    })
);

it.effect('converts to the budget instrument with the rate and rounds', () =>
    Effect.sync(() => {
        const months = [month(OCTOBER, [], [{ latestAmount: 101, dayOfMonth: 28 }])];

        expect(computeExpectedIncome(months, WEEK_ACROSS_MONTHS, 0.5)).toBe(51);
    })
);

it.effect('excludes income on the first day of the next window', () =>
    Effect.sync(() => {
        const months = [month(NOVEMBER, [], [{ latestAmount: 50, dayOfMonth: 2 }])];

        expect(computeExpectedIncome(months, WEEK_ACROSS_MONTHS, 1)).toBe(0);
    })
);

it.effect('returns zero when no income is expected', () =>
    Effect.sync(() => {
        expect(computeExpectedIncome([], WEEK_ACROSS_MONTHS, 1)).toBe(0);
    })
);
