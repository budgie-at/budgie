import { computeFundTimeFraction } from './compute-fund-time-fraction.util';

import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

const BEHIND_TOLERANCE = 0.05;

export const isFundBehind = (
    fund: Pick<BudgetSinkingFundEntityInterface, 'targetAmount' | 'fundedAmount' | 'createdAt' | 'dueAt' | 'repeatEveryMonths'>,
    now: Date
): boolean => {
    if (fund.targetAmount <= 0 || fund.dueAt.getTime() <= fund.createdAt.getTime()) {
        return false;
    }

    return fund.fundedAmount / fund.targetAmount + BEHIND_TOLERANCE < computeFundTimeFraction(fund, now);
};
