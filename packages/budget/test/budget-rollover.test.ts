import { BudgetRolloverModeEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { buildPeriodSnapshotRows } from '../src/history/utils/build-period-snapshot-rows.util';
import { computeEffectiveLimits } from '../src/rollover/utils/budget-effective-limits.util';
import { computeSnapshotCarryOuts } from '../src/rollover/utils/budget-snapshot-carry-outs.util';

import type { BudgetCarryOutsInterface } from '../src/rollover/interface/budget-carry-outs.interface';

const CATEGORY_ID = 7;

const buildSource = (mode: BudgetRolloverModeEnum, limitAmount: number, carriedIn: number, spent: number) => ({
    otherLimit: 0,
    otherSpent: 0,
    otherCarriedIn: 0,
    otherRolloverMode: BudgetRolloverModeEnum.NONE,
    categories: [{ categoryId: CATEGORY_ID, limitAmount, carriedIn, spent, rolloverMode: mode }]
});

const carryOutOf = (mode: BudgetRolloverModeEnum, limitAmount: number, carriedIn: number, spent: number): number =>
    computeSnapshotCarryOuts(buildSource(mode, limitAmount, carriedIn, spent)).byCategory.get(CATEGORY_ID) ?? 0;

const chain = (modes: readonly BudgetRolloverModeEnum[], spentByPeriod: readonly number[]): readonly number[] => {
    const carryOuts: number[] = [];
    let carryIn: BudgetCarryOutsInterface = { other: 0, byCategory: new Map() };

    modes.forEach((mode, index) => {
        const rows = buildPeriodSnapshotRows(
            [{ categoryId: CATEGORY_ID, limitAmount: 1000, rolloverMode: mode }],
            { spentOverall: spentByPeriod[index] ?? 0, spentByCategory: [{ categoryId: CATEGORY_ID, spent: spentByPeriod[index] ?? 0 }] },
            carryIn
        );

        carryIn = computeSnapshotCarryOuts({
            otherLimit: 0,
            otherSpent: rows.otherSpent,
            otherCarriedIn: 0,
            otherRolloverMode: BudgetRolloverModeEnum.NONE,
            categories: rows.categories
        });
        carryOuts.push(carryIn.byCategory.get(CATEGORY_ID) ?? 0);
    });

    return carryOuts;
};

it.effect('carries nothing when the mode is off', () =>
    Effect.sync(() => {
        expect(carryOutOf(BudgetRolloverModeEnum.NONE, 1000, 0, 400)).toBe(0);
        expect(carryOutOf(BudgetRolloverModeEnum.NONE, 1000, 0, 1500)).toBe(0);
    })
);

it.effect('carries only the surplus in savings mode', () =>
    Effect.sync(() => {
        expect(carryOutOf(BudgetRolloverModeEnum.SURPLUS, 1000, 0, 400)).toBe(600);
        expect(carryOutOf(BudgetRolloverModeEnum.SURPLUS, 1000, 0, 1500)).toBe(0);
        expect(carryOutOf(BudgetRolloverModeEnum.SURPLUS, 1000, 200, 1100)).toBe(100);
    })
);

it.effect('carries the deficit as a negative amount in carry-all mode', () =>
    Effect.sync(() => {
        expect(carryOutOf(BudgetRolloverModeEnum.SURPLUS_AND_DEFICIT, 1000, 0, 1500)).toBe(-500);
        expect(carryOutOf(BudgetRolloverModeEnum.SURPLUS_AND_DEFICIT, 1000, -500, 300)).toBe(200);
    })
);

it.effect('chains the carried amount across three periods', () =>
    Effect.sync(() => {
        const modes = Array.from({ length: 3 }, () => BudgetRolloverModeEnum.SURPLUS_AND_DEFICIT);

        expect(chain(modes, [400, 1500, 900])).toEqual([600, 100, 200]);
    })
);

it.effect('stops carrying when the mode is switched mid-way', () =>
    Effect.sync(() => {
        const modes = [BudgetRolloverModeEnum.SURPLUS, BudgetRolloverModeEnum.NONE, BudgetRolloverModeEnum.SURPLUS];

        expect(chain(modes, [400, 400, 400])).toEqual([600, 0, 600]);
    })
);

it.effect('reconstructed periods carry nothing', () =>
    Effect.sync(() => {
        const rows = buildPeriodSnapshotRows(
            [{ categoryId: CATEGORY_ID, limitAmount: 1000, rolloverMode: BudgetRolloverModeEnum.NONE }],
            { spentOverall: 100, spentByCategory: [{ categoryId: CATEGORY_ID, spent: 100 }] },
            computeSnapshotCarryOuts(undefined)
        );

        expect(rows.categories[0]?.carriedIn).toBe(0);
        expect(rows.otherCarriedIn).toBe(0);
        expect(
            computeSnapshotCarryOuts({
                otherLimit: 0,
                otherSpent: 0,
                otherCarriedIn: 0,
                otherRolloverMode: BudgetRolloverModeEnum.NONE,
                categories: rows.categories
            }).byCategory.get(CATEGORY_ID)
        ).toBe(0);
    })
);

it.effect('adds carried amounts to the overall, other and category limits', () =>
    Effect.sync(() => {
        const snapshot = {
            ...buildSource(BudgetRolloverModeEnum.SURPLUS, 1000, 0, 400),
            otherLimit: 300,
            otherSpent: 100,
            otherRolloverMode: BudgetRolloverModeEnum.SURPLUS_AND_DEFICIT
        };
        const effective = computeEffectiveLimits(snapshot, { overallLimit: 5000, otherLimit: 300 }, [
            { categoryId: CATEGORY_ID, limitAmount: 1000 }
        ]);

        expect(effective.categoryLimits).toEqual([{ categoryId: CATEGORY_ID, limitAmount: 1600, carriedAmount: 600 }]);
        expect(effective.otherLimit).toBe(500);
        expect(effective.otherCarriedAmount).toBe(200);
        expect(effective.overallLimit).toBe(5800);
    })
);

it.effect('ignores carried amounts of categories that no longer have a limit', () =>
    Effect.sync(() => {
        const effective = computeEffectiveLimits(
            buildSource(BudgetRolloverModeEnum.SURPLUS, 1000, 0, 400),
            { overallLimit: 5000, otherLimit: 0 },
            []
        );

        expect(effective.overallLimit).toBe(5000);
    })
);
