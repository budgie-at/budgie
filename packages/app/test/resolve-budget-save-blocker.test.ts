import { BudgetLimitSourceEnum, BudgetPeriodEnum, BudgetRolloverModeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { vi } from 'vitest';

import { BUDGET_SAVE_BLOCKER_LABEL } from '../src/budget/constant/budget-save-blocker-label.constant';
import { resolveBudgetSaveBlocker } from '../src/budget/utils/resolve-budget-save-blocker.util';

import type { BudgetFormValues } from '../src/budget/constant/budget-form-schema.constant';

vi.mock('@lingui/core/macro', () => ({ msg: (strings: TemplateStringsArray) => ({ id: strings.join('') }) }));

const HYDRATED: BudgetFormValues = {
    name: 'Everyday Essentials',
    period: BudgetPeriodEnum.MONTHLY,
    periodStartDay: 11,
    useLastDayOfMonth: false,
    periodAnchorMs: null,
    limitSource: BudgetLimitSourceEnum.FIXED,
    isAutoTuneEnabled: true,
    overallLimit: 5350,
    otherLimit: 2190,
    otherRolloverMode: BudgetRolloverModeEnum.NONE,
    categoryLimits: [
        { categoryId: 1, limitAmount: 2190, rolloverMode: BudgetRolloverModeEnum.NONE },
        { categoryId: 2, limitAmount: 670, rolloverMode: BudgetRolloverModeEnum.NONE },
        { categoryId: 3, limitAmount: 300, rolloverMode: BudgetRolloverModeEnum.NONE }
    ],
    instrumentId: 1
};

describe('resolveBudgetSaveBlocker', () => {
    it('lets a hydrated, fully allocated fixed budget save', () => {
        expect(resolveBudgetSaveBlocker(HYDRATED)).toBeNull();
    });

    it('names the first real blocker', () => {
        expect(resolveBudgetSaveBlocker({ ...HYDRATED, name: '  ' })).toBe(BUDGET_SAVE_BLOCKER_LABEL.name);
        expect(resolveBudgetSaveBlocker({ ...HYDRATED, overallLimit: 0 })).toBe(BUDGET_SAVE_BLOCKER_LABEL.limit);
        expect(resolveBudgetSaveBlocker({ ...HYDRATED, overallLimit: 5000 })).toBe(BUDGET_SAVE_BLOCKER_LABEL.overAllocated);
        expect(
            resolveBudgetSaveBlocker({
                ...HYDRATED,
                categoryLimits: [{ categoryId: 1, limitAmount: 0, rolloverMode: BudgetRolloverModeEnum.NONE }]
            })
        ).toBe(BUDGET_SAVE_BLOCKER_LABEL.categoryLimit);
    });

    it('ignores the fixed limit for income-based budgets', () => {
        expect(resolveBudgetSaveBlocker({ ...HYDRATED, limitSource: BudgetLimitSourceEnum.INCOME_RECEIVED, overallLimit: 0 })).toBeNull();
    });
});
