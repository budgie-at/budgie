import { BudgetRolloverModeEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { NO_FUND_COVERED } from '../src/fund/constant/no-fund-covered.constant';
import { buildPeriodSnapshotRows } from '../src/history/utils/build-period-snapshot-rows.util';

const LIMITS = [{ categoryId: 1, limitAmount: 300, rolloverMode: BudgetRolloverModeEnum.NONE }];
const NO_CARRY_IN = { other: 0, byCategory: new Map<number, number>() };
const SPENT = { spentOverall: 700, spentByCategory: [{ categoryId: 1, spent: 500 }] };

it.effect('stores category, Other and overall spend net of the fund-covered amounts', () =>
    Effect.sync(() => {
        const rows = buildPeriodSnapshotRows(LIMITS, SPENT, NO_CARRY_IN, { byCategory: new Map([[1, 200]]), other: 100 });

        expect(rows.categories).toEqual([
            { categoryId: 1, limitAmount: 300, rolloverMode: BudgetRolloverModeEnum.NONE, carriedIn: 0, fundCovered: 200, spent: 300 }
        ]);
        expect(rows.overallSpent).toBe(400);
        expect(rows.otherSpent).toBe(100);
        expect(rows.otherFundCovered).toBe(100);
    })
);

it.effect('keeps gross spend when nothing was covered by a fund', () =>
    Effect.sync(() => {
        const rows = buildPeriodSnapshotRows(LIMITS, SPENT, NO_CARRY_IN, NO_FUND_COVERED);

        expect(rows.overallSpent).toBe(700);
        expect(rows.otherSpent).toBe(200);
        expect(rows.categories[0]?.spent).toBe(500);
        expect(rows.categories[0]?.fundCovered).toBe(0);
        expect(rows.otherFundCovered).toBe(0);
    })
);

it.effect('never lets a category spend go negative when covered exceeds the recomputed spend', () =>
    Effect.sync(() => {
        const rows = buildPeriodSnapshotRows(LIMITS, { spentOverall: 100, spentByCategory: [{ categoryId: 1, spent: 100 }] }, NO_CARRY_IN, {
            byCategory: new Map([[1, 400]]),
            other: 0
        });

        expect(rows.categories[0]?.spent).toBe(0);
        expect(rows.otherSpent).toBe(0);
    })
);
