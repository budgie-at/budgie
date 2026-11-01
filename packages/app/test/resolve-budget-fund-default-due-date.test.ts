import { BudgetKindEnum, BudgetPeriodEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';

import { resolveBudgetFundDefaultDueDate } from '../src/budget/utils/resolve-budget-fund-default-due-date.util';

const MONTHLY_FROM_11TH = {
    kind: BudgetKindEnum.MAIN,
    period: BudgetPeriodEnum.MONTHLY,
    periodStartDay: 11,
    useLastDayOfMonth: false,
    periodAnchorDate: null,
    startsAt: null,
    endsAt: null
};

describe('resolveBudgetFundDefaultDueDate', () => {
    it('defaults to the last day of the next budget period', () => {
        const dueDate = resolveBudgetFundDefaultDueDate(MONTHLY_FROM_11TH, new Date(2026, 9, 31, 12));

        expect([dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()]).toEqual([2026, 11, 10]);
    });
});
