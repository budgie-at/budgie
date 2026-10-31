import { BudgetPeriodEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import { differenceInCalendarDays } from 'date-fns/differenceInCalendarDays';
import * as Effect from 'effect/Effect';

import { computePeriodWindow } from '../src/period/utils/budget-period.util';

import type { BudgetPeriodSpecInterface } from '../src/period/interface/budget-period-spec.interface';

const OCTOBER = 9;
const NOVEMBER = 10;
const MARCH = 2;

const MONTHLY_SPEC: BudgetPeriodSpecInterface = {
    period: BudgetPeriodEnum.MONTHLY,
    periodStartDay: 1,
    useLastDayOfMonth: false,
    periodAnchorDate: null
};

const weekly = (periodAnchorDate: Date | null): BudgetPeriodSpecInterface => ({
    ...MONTHLY_SPEC,
    period: BudgetPeriodEnum.WEEKLY,
    periodAnchorDate
});

const biweekly = (periodAnchorDate: Date | null): BudgetPeriodSpecInterface => ({
    ...MONTHLY_SPEC,
    period: BudgetPeriodEnum.BIWEEKLY,
    periodAnchorDate
});

const yearly = (periodAnchorDate: Date | null): BudgetPeriodSpecInterface => ({
    ...MONTHLY_SPEC,
    period: BudgetPeriodEnum.YEARLY,
    periodAnchorDate
});

it.effect('aligns weekly windows to the anchor weekday', () =>
    Effect.sync(() => {
        const window = computePeriodWindow(weekly(new Date(2026, OCTOBER, 26)), new Date(2026, OCTOBER, 29, 12));

        expect(window.periodStart).toEqual(new Date(2026, OCTOBER, 26));
        expect(window.nextPeriodStart).toEqual(new Date(2026, NOVEMBER, 2));
    })
);

it.effect('starts a new weekly window exactly at the boundary day', () =>
    Effect.sync(() => {
        const window = computePeriodWindow(weekly(new Date(2026, OCTOBER, 26)), new Date(2026, NOVEMBER, 2));

        expect(window.periodStart).toEqual(new Date(2026, NOVEMBER, 2));
        expect(window.nextPeriodStart).toEqual(new Date(2026, NOVEMBER, 9));
    })
);

it.effect('extends weekly windows backwards before the anchor', () =>
    Effect.sync(() => {
        const window = computePeriodWindow(weekly(new Date(2026, OCTOBER, 26)), new Date(2026, OCTOBER, 21, 12));

        expect(window.periodStart).toEqual(new Date(2026, OCTOBER, 19));
        expect(window.nextPeriodStart).toEqual(new Date(2026, OCTOBER, 26));
    })
);

it.effect('supports a non-Monday weekly anchor', () =>
    Effect.sync(() => {
        const window = computePeriodWindow(weekly(new Date(2026, OCTOBER, 7)), new Date(2026, OCTOBER, 29, 12));

        expect(window.periodStart).toEqual(new Date(2026, OCTOBER, 28));
        expect(window.nextPeriodStart).toEqual(new Date(2026, NOVEMBER, 4));
    })
);

it.effect('falls back to a Monday anchor when the weekly anchor is missing', () =>
    Effect.sync(() => {
        const window = computePeriodWindow(weekly(null), new Date(2026, OCTOBER, 29, 12));

        expect(window.periodStart).toEqual(new Date(2026, OCTOBER, 26));
    })
);

it.effect('aligns biweekly windows to 14-day steps from the anchor', () =>
    Effect.sync(() => {
        const window = computePeriodWindow(biweekly(new Date(2026, OCTOBER, 12)), new Date(2026, OCTOBER, 29, 12));

        expect(window.periodStart).toEqual(new Date(2026, OCTOBER, 26));
        expect(window.nextPeriodStart).toEqual(new Date(2026, NOVEMBER, 9));
    })
);

it.effect('keeps the first biweekly window until its last minute', () =>
    Effect.sync(() => {
        const window = computePeriodWindow(biweekly(new Date(2026, OCTOBER, 12)), new Date(2026, OCTOBER, 25, 23, 59));

        expect(window.periodStart).toEqual(new Date(2026, OCTOBER, 12));
        expect(window.nextPeriodStart).toEqual(new Date(2026, OCTOBER, 26));
    })
);

it.effect('starts yearly windows on the anchor month and day', () =>
    Effect.sync(() => {
        const afterAnchor = computePeriodWindow(yearly(new Date(2024, MARCH, 15)), new Date(2026, OCTOBER, 29));
        const beforeAnchor = computePeriodWindow(yearly(new Date(2024, MARCH, 15)), new Date(2026, MARCH, 14, 12));

        expect(afterAnchor.periodStart).toEqual(new Date(2026, MARCH, 15));
        expect(afterAnchor.nextPeriodStart).toEqual(new Date(2027, MARCH, 15));
        expect(beforeAnchor.periodStart).toEqual(new Date(2025, MARCH, 15));
        expect(beforeAnchor.nextPeriodStart).toEqual(new Date(2026, MARCH, 15));
    })
);

it.effect('clamps a Feb 29 yearly anchor to Feb 28 in non-leap years and restores it in leap years', () =>
    Effect.sync(() => {
        const anchor = new Date(2024, 1, 29);
        const nonLeap = computePeriodWindow(yearly(anchor), new Date(2026, 5, 1));
        const beforeLeap = computePeriodWindow(yearly(anchor), new Date(2027, 11, 1));
        const inLeap = computePeriodWindow(yearly(anchor), new Date(2028, MARCH, 1));

        expect(nonLeap.periodStart).toEqual(new Date(2026, 1, 28));
        expect(nonLeap.nextPeriodStart).toEqual(new Date(2027, 1, 28));
        expect(beforeLeap.periodStart).toEqual(new Date(2027, 1, 28));
        expect(beforeLeap.nextPeriodStart).toEqual(new Date(2028, 1, 29));
        expect(inLeap.periodStart).toEqual(new Date(2028, 1, 29));
        expect(inLeap.nextPeriodStart).toEqual(new Date(2029, 1, 28));
    })
);

it.effect('keeps monthly windows unchanged for a custom start day', () =>
    Effect.sync(() => {
        const window = computePeriodWindow({ ...MONTHLY_SPEC, periodStartDay: 15 }, new Date(2026, MARCH, 10, 12));

        expect(window.periodStart).toEqual(new Date(2026, 1, 15));
        expect(window.nextPeriodStart).toEqual(new Date(2026, MARCH, 15));
    })
);

it.effect('keeps monthly end-of-month and clamped start-day windows unchanged', () =>
    Effect.sync(() => {
        const endOfMonth = computePeriodWindow({ ...MONTHLY_SPEC, useLastDayOfMonth: true }, new Date(2026, 1, 27, 12));
        const clamped = computePeriodWindow({ ...MONTHLY_SPEC, periodStartDay: 31 }, new Date(2026, 1, 28, 12));

        expect(endOfMonth.periodStart).toEqual(new Date(2026, 0, 31));
        expect(endOfMonth.nextPeriodStart).toEqual(new Date(2026, 1, 28));
        expect(clamped.periodStart).toEqual(new Date(2026, 1, 28));
        expect(clamped.nextPeriodStart).toEqual(new Date(2026, MARCH, 31));
    })
);

it.effect('stays on local midnight across the autumn DST change', () =>
    Effect.sync(() => {
        const spec = weekly(new Date(2026, OCTOBER, 19));
        const crossing = computePeriodWindow(spec, new Date(2026, OCTOBER, 22, 12));
        const after = computePeriodWindow(spec, new Date(2026, OCTOBER, 27, 12));

        expect(crossing.periodStart).toEqual(new Date(2026, OCTOBER, 19));
        expect(crossing.nextPeriodStart).toEqual(new Date(2026, OCTOBER, 26));
        expect(crossing.nextPeriodStart.getHours()).toBe(0);
        expect(differenceInCalendarDays(crossing.nextPeriodStart, crossing.periodStart)).toBe(7);
        expect(after.periodStart).toEqual(new Date(2026, OCTOBER, 26));
        expect(after.periodStart.getHours()).toBe(0);
    })
);

it.effect('stays on local midnight across the spring DST change for biweekly windows', () =>
    Effect.sync(() => {
        const spec = biweekly(new Date(2026, MARCH, 16));
        const crossing = computePeriodWindow(spec, new Date(2026, MARCH, 20, 12));
        const after = computePeriodWindow(spec, new Date(2026, MARCH, 30, 12));

        expect(crossing.periodStart).toEqual(new Date(2026, MARCH, 16));
        expect(crossing.nextPeriodStart).toEqual(new Date(2026, MARCH, 30));
        expect(crossing.nextPeriodStart.getHours()).toBe(0);
        expect(differenceInCalendarDays(crossing.nextPeriodStart, crossing.periodStart)).toBe(14);
        expect(after.periodStart).toEqual(new Date(2026, MARCH, 30));
    })
);
