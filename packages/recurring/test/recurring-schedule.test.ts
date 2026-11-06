import { RecurringCadenceUnitEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    cadencePeriodDays,
    cadenceToleranceDays,
    monthlyEquivalent,
    nearestCycleDate,
    nextOccurrences,
    occurrencesInRange
} from '../src/series/recurring-schedule';

import type { RecurringScheduleInterface } from '../src/interface/recurring-schedule.interface';

const schedule = (
    cadenceUnit: RecurringCadenceUnitEnum,
    cadenceInterval: number,
    anchorDate: Date,
    endsAt: Date | null = null
): RecurringScheduleInterface => ({ cadenceUnit, cadenceInterval, anchorDate, endsAt });

const days = (dates: readonly Date[]) => dates.map(date => [date.getFullYear(), date.getMonth(), date.getDate()]);

it.effect('clamps month-end anchors without drifting the billing day', () =>
    Effect.sync(() => {
        const monthly = schedule(RecurringCadenceUnitEnum.MONTH, 1, new Date(2026, 0, 31));

        expect(days(nextOccurrences(monthly, new Date(2026, 0, 31), 4))).toEqual([
            [2026, 0, 31],
            [2026, 1, 28],
            [2026, 2, 31],
            [2026, 3, 30]
        ]);
        expect(days(nextOccurrences(monthly, new Date(2028, 1, 1), 1))).toEqual([[2028, 1, 29]]);
    })
);

it.effect('projects weekly, biweekly and yearly cycles from the anchor', () =>
    Effect.sync(() => {
        expect(days(nextOccurrences(schedule(RecurringCadenceUnitEnum.WEEK, 1, new Date(2026, 5, 1)), new Date(2026, 5, 10), 2))).toEqual([
            [2026, 5, 15],
            [2026, 5, 22]
        ]);
        expect(days(nextOccurrences(schedule(RecurringCadenceUnitEnum.WEEK, 2, new Date(2026, 5, 1)), new Date(2026, 5, 10), 2))).toEqual([
            [2026, 5, 15],
            [2026, 5, 29]
        ]);
        expect(days(nextOccurrences(schedule(RecurringCadenceUnitEnum.YEAR, 1, new Date(2024, 1, 29)), new Date(2026, 0, 1), 2))).toEqual([
            [2026, 1, 28],
            [2027, 1, 28]
        ]);
    })
);

it.effect('never yields occurrences before the anchor or after endsAt', () =>
    Effect.sync(() => {
        const monthly = schedule(RecurringCadenceUnitEnum.MONTH, 1, new Date(2026, 5, 3), new Date(2026, 7, 3));

        expect(days(nextOccurrences(monthly, new Date(2026, 0, 1), 10))).toEqual([
            [2026, 5, 3],
            [2026, 6, 3],
            [2026, 7, 3]
        ]);
        expect(nextOccurrences(monthly, new Date(2026, 7, 4), 3)).toEqual([]);
        expect(days(occurrencesInRange(monthly, new Date(2026, 6, 1), new Date(2026, 8, 1)))).toEqual([
            [2026, 6, 3],
            [2026, 7, 3]
        ]);
    })
);

it.effect('derives tolerance from the nearest standard cadence', () =>
    Effect.sync(() => {
        expect(cadenceToleranceDays({ cadenceUnit: RecurringCadenceUnitEnum.WEEK, cadenceInterval: 1 })).toBe(1);
        expect(cadenceToleranceDays({ cadenceUnit: RecurringCadenceUnitEnum.WEEK, cadenceInterval: 2 })).toBe(2);
        expect(cadenceToleranceDays({ cadenceUnit: RecurringCadenceUnitEnum.MONTH, cadenceInterval: 1 })).toBe(4);
        expect(cadenceToleranceDays({ cadenceUnit: RecurringCadenceUnitEnum.WEEK, cadenceInterval: 5 })).toBe(4);
        expect(cadenceToleranceDays({ cadenceUnit: RecurringCadenceUnitEnum.MONTH, cadenceInterval: 4 })).toBe(8);
        expect(cadenceToleranceDays({ cadenceUnit: RecurringCadenceUnitEnum.YEAR, cadenceInterval: 1 })).toBe(10);
        expect(cadencePeriodDays({ cadenceUnit: RecurringCadenceUnitEnum.WEEK, cadenceInterval: 5 })).toBe(35);
    })
);

it.effect('finds the nearest cycle date in either direction', () =>
    Effect.sync(() => {
        const monthly = schedule(RecurringCadenceUnitEnum.MONTH, 1, new Date(2026, 5, 20));
        const past = nearestCycleDate(monthly, new Date(2026, 3, 21));
        const future = nearestCycleDate(monthly, new Date(2026, 8, 17));

        expect(days([past.cycleDate])).toEqual([[2026, 3, 20]]);
        expect(past.deviationDays).toBe(1);
        expect(days([future.cycleDate])).toEqual([[2026, 8, 20]]);
        expect(future.deviationDays).toBe(3);
    })
);

it.effect('converts every cadence to a monthly equivalent', () =>
    Effect.sync(() => {
        expect(monthlyEquivalent({ cadenceUnit: RecurringCadenceUnitEnum.MONTH, cadenceInterval: 1, amount: 120 })).toBe(120);
        expect(monthlyEquivalent({ cadenceUnit: RecurringCadenceUnitEnum.MONTH, cadenceInterval: 3, amount: 120 })).toBe(40);
        expect(monthlyEquivalent({ cadenceUnit: RecurringCadenceUnitEnum.YEAR, cadenceInterval: 1, amount: 120 })).toBe(10);
        expect(monthlyEquivalent({ cadenceUnit: RecurringCadenceUnitEnum.WEEK, cadenceInterval: 1, amount: 12 })).toBeCloseTo(52);
        expect(monthlyEquivalent({ cadenceUnit: RecurringCadenceUnitEnum.WEEK, cadenceInterval: 2, amount: 12 })).toBeCloseTo(26);
    })
);

it.effect('yields no occurrences for a non-positive cadence interval', () =>
    Effect.sync(() => {
        const broken = schedule(RecurringCadenceUnitEnum.MONTH, 0, new Date(2026, 0, 31));

        expect(nextOccurrences(broken, new Date(2026, 0, 31), 3)).toEqual([]);
        expect(occurrencesInRange(broken, new Date(2026, 0, 1), new Date(2026, 5, 1))).toEqual([]);
    })
);
