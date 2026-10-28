import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { BudgetCommittedSourceKindEnum } from '../src/projection/enum/budget-committed-source-kind.enum';
import { BudgetPaceStatusEnum } from '../src/projection/enum/budget-pace-status.enum';
import { computeBudgetProjection } from '../src/projection/utils/budget-projection.util';

import type { BudgetProjectionEntryInterface } from '../src/projection/interface/budget-projection-entry.interface';
import type { BudgetProjectionInputInterface } from '../src/projection/interface/budget-projection-input.interface';
import type { BudgetUpcomingChargeInterface } from '../src/projection/interface/budget-upcoming-charge.interface';

const OCTOBER = 9;
const NOVEMBER = 10;
const MONTHLY_CADENCE_DAYS = 30;

const october = (day: number, hour = 12) => new Date(2026, OCTOBER, day, hour);
const november = (day: number, hour = 12) => new Date(2026, NOVEMBER, day, hour);

const variable = (operatedAt: Date, amount: number, categoryId: number | null = null): BudgetProjectionEntryInterface => ({
    amount,
    categoryId,
    operatedAt,
    committedSource: null
});

const recurringEntry = (operatedAt: Date, amount: number, seriesId: number): BudgetProjectionEntryInterface => ({
    amount,
    categoryId: null,
    operatedAt,
    committedSource: { kind: BudgetCommittedSourceKindEnum.RECURRING, id: seriesId }
});

const upcomingRecurring = (
    date: Date,
    amount: number,
    seriesId: number,
    categoryId: number | null = null
): BudgetUpcomingChargeInterface => ({
    date,
    amount,
    categoryId,
    title: `Series ${seriesId}`,
    source: { kind: BudgetCommittedSourceKindEnum.RECURRING, id: seriesId },
    cadenceDays: MONTHLY_CADENCE_DAYS
});

const variableRun = (days: readonly number[], amount: number, categoryId: number | null = null) =>
    days.map(day => variable(october(day), amount, categoryId));

const octoberInput = (overrides: Partial<BudgetProjectionInputInterface>): BudgetProjectionInputInterface => ({
    periodStart: new Date(2026, OCTOBER, 1),
    nextPeriodStart: new Date(2026, NOVEMBER, 1),
    now: october(15),
    overallLimit: 1000,
    otherLimit: 0,
    categoryLimits: [],
    entries: [],
    upcomingCharges: [],
    ...overrides
});

it.effect('keeps a steady month on track with free money reduced only by spent', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(octoberInput({ entries: variableRun([1, 3, 5, 6, 8, 9, 11, 12, 14, 15], 10) }));

        expect(projection.totalDays).toBe(31);
        expect(projection.elapsedDays).toBe(15);
        expect(projection.daysLeft).toBe(17);
        expect(projection.overall.status).toBe(BudgetPaceStatusEnum.ON_TRACK);
        expect(projection.overall.spent).toBe(100);
        expect(projection.overall.free).toBe(900);
        expect(projection.overall.projectedEnd).toBeCloseTo(100 + (100 / 15) * 16);
        expect(projection.overall.runOutAt).toBeNull();
    })
);

it.effect('flags a fast month as ahead of pace with the day the projection crosses the limit', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(octoberInput({ now: october(10), entries: variableRun([2, 4, 6, 8, 10], 100) }));

        expect(projection.overall.status).toBe(BudgetPaceStatusEnum.AHEAD);
        expect(projection.overall.projectedEnd).toBe(1550);
        expect(projection.overall.projectedOver).toBe(550);
        expect(projection.overall.projectedRatio).toBe(1.55);
        expect(projection.overall.runOutAt).toEqual(new Date(2026, OCTOBER, 21));
        expect(projection.days).toHaveLength(31);
        expect(projection.days[9]).toEqual({ date: new Date(2026, OCTOBER, 10), actual: 500, projected: 500 });
        expect(projection.days[10].actual).toBeNull();
        expect(projection.days[30].projected).toBe(1550);
        expect(projection.days[8].projected).toBeNull();
    })
);

it.effect('reports over budget once spent exceeds the limit', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(octoberInput({ entries: variableRun([1, 2, 3, 4, 5, 6], 200) }));

        expect(projection.overall.status).toBe(BudgetPaceStatusEnum.OVER);
        expect(projection.overall.free).toBe(-200);
        expect(projection.overall.runOutAt).toBeNull();
    })
);

it.effect('stays too early in the first days and with too few variable entries', () =>
    Effect.sync(() => {
        const firstDays = computeBudgetProjection(
            octoberInput({
                now: october(2),
                entries: variableRun([1, 1, 1, 2, 2, 2], 50),
                upcomingCharges: [upcomingRecurring(october(20), 100, 1)]
            })
        );
        const fewEntries = computeBudgetProjection(octoberInput({ entries: variableRun([1, 5, 9, 13], 50) }));

        expect(firstDays.overall.status).toBe(BudgetPaceStatusEnum.TOO_EARLY);
        expect(firstDays.overall.projectedEnd).toBeNull();
        expect(firstDays.overall.projectedRatio).toBeNull();
        expect(firstDays.overall.spent).toBe(300);
        expect(firstDays.overall.upcoming).toBe(100);
        expect(firstDays.overall.free).toBe(600);
        expect(firstDays.days.every(day => day.projected === null)).toBe(true);
        expect(fewEntries.overall.status).toBe(BudgetPaceStatusEnum.TOO_EARLY);
    })
);

it.effect('does not extrapolate fixed rent posted on the first day', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(
            octoberInput({
                now: october(10),
                overallLimit: 1500,
                entries: [recurringEntry(october(1), 800, 1), ...variableRun([2, 4, 6, 8, 10], 10)]
            })
        );

        expect(projection.overall.status).toBe(BudgetPaceStatusEnum.ON_TRACK);
        expect(projection.overall.projectedEnd).toBe(850 + 5 * 21);
    })
);

it.effect('tracks variable spend per elapsed day without counting fixed rent', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(
            octoberInput({
                now: october(10),
                overallLimit: 1500,
                entries: [recurringEntry(october(1), 800, 1), ...variableRun([2, 4, 6, 8, 10], 10)]
            })
        );
        const variableSpentByDay = projection.days.map(day => day.variableSpent);

        expect(variableSpentByDay.slice(0, 10)).toEqual([0, 10, 0, 10, 0, 10, 0, 10, 0, 10]);
        expect(variableSpentByDay.slice(10).every(value => value === null)).toBe(true);
        expect(projection.days[0]?.actual).toBe(800);
    })
);

it.effect('derives the daily allowance from the limit minus posted and upcoming committed charges', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(
            octoberInput({
                now: october(10),
                overallLimit: 1500,
                entries: [recurringEntry(october(1), 800, 1), ...variableRun([2, 4, 6, 8, 10], 10)],
                upcomingCharges: [upcomingRecurring(october(20), 100, 2)]
            })
        );
        const withoutCommitted = computeBudgetProjection(octoberInput({ overallLimit: 3100 }));

        expect(projection.dailyAllowance).toBeCloseTo((1500 - 800 - 100) / 31);
        expect(withoutCommitted.dailyAllowance).toBe(100);
    })
);

it.effect('never reports a negative daily allowance when committed charges exceed the limit', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(octoberInput({ overallLimit: 100, upcomingCharges: [upcomingRecurring(october(20), 500, 3)] }));

        expect(projection.dailyAllowance).toBe(0);
    })
);

it.effect('reserves upcoming charges and never counts a posted recurring charge again', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(
            octoberInput({
                periodStart: new Date(2026, OCTOBER, 15),
                nextPeriodStart: new Date(2026, NOVEMBER, 15),
                now: october(31),
                entries: [recurringEntry(october(31, 8), 15, 7), ...variableRun([15, 18, 21, 24, 27, 30], 20)],
                upcomingCharges: [upcomingRecurring(november(1), 15, 7), upcomingRecurring(november(5), 40, 8)]
            })
        );

        expect(projection.upcomingCharges.map(charge => charge.source.id)).toEqual([8]);
        expect(projection.overall.upcoming).toBe(40);
        expect(projection.overall.free).toBe(1000 - 135 - 40);
    })
);

it.effect('projects a period that crosses a month boundary', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(
            octoberInput({
                periodStart: new Date(2026, OCTOBER, 15),
                nextPeriodStart: new Date(2026, NOVEMBER, 15),
                now: november(3),
                entries: [...variableRun([15, 20, 25, 30], 30), variable(november(2), 30)],
                upcomingCharges: [
                    upcomingRecurring(november(1), 50, 1),
                    upcomingRecurring(november(10), 60, 2),
                    upcomingRecurring(november(15), 70, 3)
                ]
            })
        );

        expect(projection.totalDays).toBe(31);
        expect(projection.elapsedDays).toBe(20);
        expect(projection.daysLeft).toBe(12);
        expect(projection.days.at(-1)?.date).toEqual(new Date(2026, NOVEMBER, 14));
        expect(projection.upcomingCharges.map(charge => charge.source.id)).toEqual([2]);
        expect(projection.overall.projectedEnd).toBeCloseTo(150 + 60 + (150 / 20) * 11);
        expect(projection.days[26].projected).toBeCloseTo(150 + 60 + (150 / 20) * 7);
        expect(projection.days[25].projected).toBeCloseTo(150 + (150 / 20) * 6);
    })
);

it.effect('splits limited categories from Other and sorts categories by risk', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(
            octoberInput({
                otherLimit: 300,
                categoryLimits: [
                    { categoryId: 1, limitAmount: 400 },
                    { categoryId: 2, limitAmount: 100 },
                    { categoryId: 3, limitAmount: 200 }
                ],
                entries: [
                    ...variableRun([1, 3, 5, 7, 9], 10, 1),
                    ...variableRun([2, 4, 6, 8, 10], 30, 2),
                    variable(october(3), 150, 3),
                    variable(october(4), 25, 4),
                    variable(october(5), 15, null)
                ],
                upcomingCharges: [upcomingRecurring(october(20), 100, 9, 1)]
            })
        );
        const byCategory = new Map(projection.categories.map(category => [category.categoryId, category]));

        expect(projection.categories.map(category => category.categoryId)).toEqual([2, 1, 3]);
        expect(byCategory.get(2)?.status).toBe(BudgetPaceStatusEnum.OVER);
        expect(byCategory.get(1)?.spent).toBe(50);
        expect(byCategory.get(1)?.upcoming).toBe(100);
        expect(byCategory.get(1)?.free).toBe(250);
        expect(byCategory.get(3)?.status).toBe(BudgetPaceStatusEnum.TOO_EARLY);
        expect(projection.other.spent).toBe(40);
        expect(projection.other.upcoming).toBe(0);
        expect(projection.other.free).toBe(260);
        expect(projection.overall.spent).toBe(390);
        expect(projection.overall.upcoming).toBe(100);
    })
);

it.effect('spreads free money over the days left including today, rounded down', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(
            octoberInput({ entries: variableRun([1, 3, 5], 100), upcomingCharges: [upcomingRecurring(october(20), 100, 1)] })
        );

        expect(projection.daysLeft).toBe(17);
        expect(projection.overall.free).toBe(600);
        expect(projection.overall.safePerDay).toBe(35);
    })
);

it.effect('gives the whole free amount on the last day of the period', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(octoberInput({ now: october(31), entries: variableRun([1, 3, 5], 100) }));

        expect(projection.daysLeft).toBe(1);
        expect(projection.overall.safePerDay).toBe(700);
    })
);

it.effect('never reports a negative safe per day when free money is negative', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(octoberInput({ entries: variableRun([1, 2, 3, 4, 5, 6], 200) }));

        expect(projection.overall.free).toBe(-200);
        expect(projection.overall.safePerDay).toBe(0);
    })
);
