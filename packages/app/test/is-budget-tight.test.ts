import { BudgetPaceStatusEnum } from '@budgie/budget';
import { BudgetLimitSourceEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { isBudgetTight } from '../src/budget/utils/is-budget-tight.util';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

const scope = (overrides: Partial<BudgetProjectionScopeInterface>): BudgetProjectionScopeInterface => ({
    limit: 5350,
    spent: 3545,
    upcoming: 0,
    reserved: 0,
    free: 1805,
    safePerDay: 164,
    elapsedFraction: 0.65,
    projectedEnd: 5149,
    projectedOver: -201,
    projectedRatio: 0.96,
    status: BudgetPaceStatusEnum.ON_TRACK,
    runOutAt: null,
    ...overrides
});

const projection = (overall: BudgetProjectionScopeInterface, categoryLimit = 3160, otherLimit = 2190) => ({
    overall,
    other: scope({ limit: otherLimit }),
    categories: [{ categoryId: 1, ...scope({ limit: categoryLimit }) }],
    dailyAllowance: 161
});

describe('isBudgetTight', () => {
    it('keeps a comfortable on-track budget on track', () => {
        expect(isBudgetTight(projection(scope({})), BudgetLimitSourceEnum.FIXED)).toBe(false);
    });

    it('flags a projected margin under one day of plan', () => {
        expect(isBudgetTight(projection(scope({ projectedEnd: 5349 })), BudgetLimitSourceEnum.FIXED)).toBe(true);
    });

    it('flags an income budget whose categories exceed the income', () => {
        const income = scope({ limit: 5150, projectedEnd: 4000 });

        expect(isBudgetTight(projection(income), BudgetLimitSourceEnum.INCOME_RECEIVED)).toBe(true);
    });

    it('leaves ahead and over budgets to their own status', () => {
        expect(
            isBudgetTight(projection(scope({ status: BudgetPaceStatusEnum.AHEAD, projectedEnd: 5349 })), BudgetLimitSourceEnum.FIXED)
        ).toBe(false);
        expect(isBudgetTight(projection(scope({ status: BudgetPaceStatusEnum.OVER })), BudgetLimitSourceEnum.FIXED)).toBe(false);
    });
});
