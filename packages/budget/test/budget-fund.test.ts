import { BudgetPeriodEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { applyFundDraws } from '../src/fund/utils/apply-fund-draws.util';
import { computeFundDueWindow } from '../src/fund/utils/compute-fund-due-window.util';
import { computeFundSetAside } from '../src/fund/utils/compute-fund-set-aside.util';
import { matchFundSpend } from '../src/fund/utils/match-fund-spend.util';
import { toBudgetCurrencyEntries } from '../src/spent/utils/to-budget-currency-entries.util';

import type { BudgetFundScheduleInterface } from '../src/fund/interface/budget-fund-schedule.interface';
import type { BudgetPeriodSpecInterface } from '../src/period/interface/budget-period-spec.interface';

const OCTOBER = 9;
const NOVEMBER = 10;
const DECEMBER = 11;

const MONTHLY_SPEC: BudgetPeriodSpecInterface = {
    period: BudgetPeriodEnum.MONTHLY,
    periodStartDay: 1,
    useLastDayOfMonth: false,
    periodAnchorDate: null
};

const OCTOBER_WINDOW = { periodStart: new Date(2026, OCTOBER, 1), nextPeriodStart: new Date(2026, NOVEMBER, 1) };

const scheduleOf = (overrides: Partial<BudgetFundScheduleInterface> = {}): BudgetFundScheduleInterface => ({
    targetAmount: 1200,
    fundedAmount: 0,
    dueAt: new Date(2026, DECEMBER, 15),
    ...overrides
});

it.effect('spans 30 days before to 30 days after the due day', () =>
    Effect.sync(() => {
        const window = computeFundDueWindow(new Date(2026, DECEMBER, 15, 14));

        expect(window.periodStart).toEqual(new Date(2026, NOVEMBER, 15));
        expect(window.nextPeriodStart).toEqual(new Date(2027, 0, 15));
    })
);

it.effect('spreads the remaining target over the periods until the fund is due', () =>
    Effect.sync(() => {
        expect(computeFundSetAside(scheduleOf(), OCTOBER_WINDOW, MONTHLY_SPEC)).toBe(400);
    })
);

it.effect('raises the set-aside when the fund is behind', () =>
    Effect.sync(() => {
        expect(computeFundSetAside(scheduleOf({ fundedAmount: 100 }), OCTOBER_WINDOW, MONTHLY_SPEC)).toBe(367);
    })
);

it.effect('sets nothing aside when the fund is fully funded or ahead', () =>
    Effect.sync(() => {
        expect(computeFundSetAside(scheduleOf({ fundedAmount: 1200 }), OCTOBER_WINDOW, MONTHLY_SPEC)).toBe(0);
        expect(computeFundSetAside(scheduleOf({ fundedAmount: 1500 }), OCTOBER_WINDOW, MONTHLY_SPEC)).toBe(0);
    })
);

it.effect('self-corrects when the target is edited', () =>
    Effect.sync(() => {
        expect(computeFundSetAside(scheduleOf({ targetAmount: 600, fundedAmount: 100 }), OCTOBER_WINDOW, MONTHLY_SPEC)).toBe(167);
    })
);

it.effect('reserves the whole remainder when the fund is due in the current period', () =>
    Effect.sync(() => {
        expect(computeFundSetAside(scheduleOf({ dueAt: new Date(2026, OCTOBER, 20) }), OCTOBER_WINDOW, MONTHLY_SPEC)).toBe(1200);
    })
);

it.effect('reserves the whole remainder when the fund is overdue or due on the next period start', () =>
    Effect.sync(() => {
        expect(computeFundSetAside(scheduleOf({ dueAt: new Date(2026, 8, 1) }), OCTOBER_WINDOW, MONTHLY_SPEC)).toBe(1200);
        expect(computeFundSetAside(scheduleOf({ dueAt: new Date(2026, NOVEMBER, 1) }), OCTOBER_WINDOW, MONTHLY_SPEC)).toBe(1200);
    })
);

it.effect('counts periods with the budget cadence', () =>
    Effect.sync(() => {
        const weekly: BudgetPeriodSpecInterface = {
            ...MONTHLY_SPEC,
            period: BudgetPeriodEnum.WEEKLY,
            periodAnchorDate: new Date(2026, OCTOBER, 26)
        };
        const window = { periodStart: new Date(2026, OCTOBER, 26), nextPeriodStart: new Date(2026, NOVEMBER, 2) };

        expect(computeFundSetAside(scheduleOf({ targetAmount: 400, dueAt: new Date(2026, NOVEMBER, 20) }), window, weekly)).toBe(100);
    })
);

it.effect('reserves everything in the last yearly period before the due day', () =>
    Effect.sync(() => {
        const yearly: BudgetPeriodSpecInterface = {
            ...MONTHLY_SPEC,
            period: BudgetPeriodEnum.YEARLY,
            periodAnchorDate: new Date(2024, 2, 15)
        };
        const window = { periodStart: new Date(2026, 2, 15), nextPeriodStart: new Date(2027, 2, 15) };

        expect(computeFundSetAside(scheduleOf({ dueAt: new Date(2027, 0, 10) }), window, yearly)).toBe(1200);
    })
);

const spend = (entryId: number, categoryId: number | null, amount: number, operatedAt: Date) => ({
    entryId,
    categoryId,
    amount,
    operatedAt
});

const INSURANCE_CATEGORY = 5;
const insuranceFund = { id: 1, categoryId: INSURANCE_CATEGORY, fundedAmount: 500, dueAt: new Date(2026, DECEMBER, 15) };

it.effect('draws chronologically from the fund inside the due window up to its balance', () =>
    Effect.sync(() => {
        const draws = matchFundSpend(
            [
                spend(4, INSURANCE_CATEGORY, 400, new Date(2026, DECEMBER, 5, 12)),
                spend(1, INSURANCE_CATEGORY, 300, new Date(2026, NOVEMBER, 20, 12)),
                spend(2, INSURANCE_CATEGORY, 100, new Date(2026, NOVEMBER, 10, 12)),
                spend(5, INSURANCE_CATEGORY, 50, new Date(2026, DECEMBER, 20, 12)),
                spend(3, 6, 80, new Date(2026, DECEMBER, 1, 12))
            ],
            [insuranceFund]
        );

        expect(draws).toEqual([
            { fundId: 1, entryId: 1, amount: 300 },
            { fundId: 1, entryId: 4, amount: 200 }
        ]);
    })
);

it.effect('includes the first and last day of the due window and excludes the day after', () =>
    Effect.sync(() => {
        const draws = matchFundSpend(
            [
                spend(1, INSURANCE_CATEGORY, 10, new Date(2026, NOVEMBER, 15)),
                spend(2, INSURANCE_CATEGORY, 10, new Date(2027, 0, 14, 23)),
                spend(3, INSURANCE_CATEGORY, 10, new Date(2027, 0, 15)),
                spend(4, INSURANCE_CATEGORY, 10, new Date(2026, NOVEMBER, 14, 23))
            ],
            [insuranceFund]
        );

        expect(draws.map(draw => draw.entryId)).toEqual([1, 2]);
    })
);

it.effect('splits one expense across funds of the same category in due order', () =>
    Effect.sync(() => {
        const draws = matchFundSpend(
            [spend(1, INSURANCE_CATEGORY, 150, new Date(2026, DECEMBER, 10, 12))],
            [
                { id: 2, categoryId: INSURANCE_CATEGORY, fundedAmount: 100, dueAt: new Date(2026, DECEMBER, 20) },
                { id: 1, categoryId: INSURANCE_CATEGORY, fundedAmount: 100, dueAt: new Date(2026, DECEMBER, 15) }
            ]
        );

        expect(draws).toEqual([
            { fundId: 1, entryId: 1, amount: 100 },
            { fundId: 2, entryId: 1, amount: 50 }
        ]);
    })
);

it.effect('removes the drawn part of an entry and drops entries that are fully covered', () =>
    Effect.sync(() => {
        const entries = [
            { entryId: 1, amount: 300 },
            { entryId: 2, amount: 100 },
            { entryId: 3, amount: 20 }
        ];
        const adjusted = applyFundDraws(entries, [
            { fundId: 1, entryId: 1, amount: 300 },
            { fundId: 1, entryId: 2, amount: 40 }
        ]);

        expect(adjusted).toEqual([
            { entryId: 2, amount: 60 },
            { entryId: 3, amount: 20 }
        ]);
    })
);

it.effect('converts spent rows to the budget currency and marks them as converted', () =>
    Effect.sync(() => {
        const operatedAt = new Date(2026, OCTOBER, 3);
        const [converted] = toBudgetCurrencyEntries(
            [{ entryId: 1, transactionId: 9, categoryId: null, amount: 50, instrumentId: 2, rate: 2, operatedAt }],
            1
        );

        expect(converted).toEqual({ entryId: 1, transactionId: 9, categoryId: null, amount: 100, instrumentId: 1, rate: null, operatedAt });
    })
);
