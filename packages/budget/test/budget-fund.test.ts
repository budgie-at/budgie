import { BudgetPeriodEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { computeFundDueWindow } from '../src/fund/utils/compute-fund-due-window.util';
import { computeFundSetAside } from '../src/fund/utils/compute-fund-set-aside.util';

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
