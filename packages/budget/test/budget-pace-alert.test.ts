import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { BudgetAlertKindEnum } from '../src/alert/enum/budget-alert-kind.enum';
import { BudgetAlertScopeEnum } from '../src/alert/enum/budget-alert-scope.enum';
import { computeBudgetPaceTriggers } from '../src/alert/utils/budget-alert-threshold.util';
import { computeBudgetProjection } from '../src/projection/utils/budget-projection.util';

import type { BudgetProjectionEntryInterface } from '../src/projection/interface/budget-projection-entry.interface';
import type { BudgetProjectionInputInterface } from '../src/projection/interface/budget-projection-input.interface';

const OCTOBER = 9;
const GROCERIES_ID = 7;

const variableRun = (days: readonly number[], amount: number, categoryId: number | null): BudgetProjectionEntryInterface[] =>
    days.map(day => ({ amount, categoryId, operatedAt: new Date(2026, OCTOBER, day, 12), committedSource: null }));

const octoberInput = (overrides: Partial<BudgetProjectionInputInterface>): BudgetProjectionInputInterface => ({
    periodStart: new Date(2026, OCTOBER, 1),
    nextPeriodStart: new Date(2026, OCTOBER + 1, 1),
    now: new Date(2026, OCTOBER, 10, 12),
    overallLimit: 100_000,
    otherLimit: 0,
    categoryLimits: [{ categoryId: GROCERIES_ID, limitAmount: 1000 }],
    entries: [],
    upcomingCharges: [],
    reservations: [],
    ...overrides
});

it.effect('emits a pace trigger for the overall budget and the category that are ahead of pace', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(
            octoberInput({ overallLimit: 1000, entries: variableRun([2, 4, 6, 8, 10], 100, GROCERIES_ID) })
        );

        expect(computeBudgetPaceTriggers(projection)).toEqual([
            { kind: BudgetAlertKindEnum.PACE, scope: BudgetAlertScopeEnum.OVERALL, categoryId: null, threshold: 100 },
            { kind: BudgetAlertKindEnum.PACE, scope: BudgetAlertScopeEnum.CATEGORY, categoryId: GROCERIES_ID, threshold: 100 }
        ]);
    })
);

it.effect('emits a pace trigger for other spending when its limit is projected to be exceeded', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(octoberInput({ otherLimit: 1000, entries: variableRun([2, 4, 6, 8, 10], 100, null) }));

        expect(computeBudgetPaceTriggers(projection)).toEqual([
            { kind: BudgetAlertKindEnum.PACE, scope: BudgetAlertScopeEnum.OTHER, categoryId: null, threshold: 100 }
        ]);
    })
);

it.effect('emits no pace trigger while it is too early to forecast', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(
            octoberInput({
                now: new Date(2026, OCTOBER, 2, 12),
                overallLimit: 100,
                entries: variableRun([1, 1, 1, 2, 2, 2], 50, GROCERIES_ID)
            })
        );

        expect(computeBudgetPaceTriggers(projection)).toEqual([]);
    })
);

it.effect('emits no pace trigger when spending is on track', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(
            octoberInput({
                categoryLimits: [{ categoryId: GROCERIES_ID, limitAmount: 5000 }],
                entries: variableRun([1, 3, 5, 7, 9], 10, GROCERIES_ID)
            })
        );

        expect(computeBudgetPaceTriggers(projection)).toEqual([]);
    })
);

it.effect('emits no pace trigger once a limit is already exceeded', () =>
    Effect.sync(() => {
        const projection = computeBudgetProjection(
            octoberInput({ overallLimit: 400, entries: variableRun([1, 2, 3, 4, 5, 6], 200, GROCERIES_ID) })
        );

        expect(computeBudgetPaceTriggers(projection)).toEqual([]);
    })
);
