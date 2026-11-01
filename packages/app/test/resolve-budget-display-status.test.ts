import { BudgetPaceStatusEnum } from '@budgie/budget';
import { BudgetLimitSourceEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { vi } from 'vitest';

import { resolveBudgetDisplayStatus } from '../src/budget/utils/resolve-budget-display-status.util';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

vi.mock('@lingui/core/macro', () => ({ msg: (strings: TemplateStringsArray) => ({ id: strings.join('') }) }));

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

const projection = (overall: BudgetProjectionScopeInterface) => ({
    overall,
    other: scope({ limit: 2190 }),
    categories: [{ categoryId: 1, ...scope({ limit: 3160 }) }],
    dailyAllowance: 161
});

describe('resolveBudgetDisplayStatus', () => {
    it('keeps a comfortable budget on track and positive', () => {
        expect(resolveBudgetDisplayStatus(projection(scope({})), BudgetLimitSourceEnum.FIXED)).toMatchObject({
            tone: 'positive',
            isTight: false
        });
    });

    it('turns a margin under one day of plan into a single tight warning state', () => {
        expect(resolveBudgetDisplayStatus(projection(scope({ projectedEnd: 5349 })), BudgetLimitSourceEnum.FIXED)).toMatchObject({
            tone: 'warning',
            label: { id: 'Tight' },
            isTight: true
        });
    });

    it('turns an over-assigned income budget tight', () => {
        const income = scope({ limit: 5150, projectedEnd: 4000 });

        expect(resolveBudgetDisplayStatus(projection(income), BudgetLimitSourceEnum.INCOME_RECEIVED).isTight).toBe(true);
    });

    it('leaves ahead and over budgets to their own tone', () => {
        expect(
            resolveBudgetDisplayStatus(
                projection(scope({ status: BudgetPaceStatusEnum.AHEAD, projectedEnd: 5349 })),
                BudgetLimitSourceEnum.FIXED
            )
        ).toMatchObject({ tone: 'warning', isTight: false });
        expect(
            resolveBudgetDisplayStatus(projection(scope({ status: BudgetPaceStatusEnum.OVER })), BudgetLimitSourceEnum.FIXED)
        ).toMatchObject({
            tone: 'destructive',
            isTight: false
        });
    });
});
