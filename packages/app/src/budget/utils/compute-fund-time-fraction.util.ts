import { addMonths } from 'date-fns/addMonths';

import { isDefined } from '@rnw-community/shared';

import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

export const computeFundTimeFraction = (
    fund: Pick<BudgetSinkingFundEntityInterface, 'createdAt' | 'dueAt' | 'repeatEveryMonths'>,
    now: Date
): number => {
    const cycleStartMs = isDefined(fund.repeatEveryMonths)
        ? Math.max(fund.createdAt.getTime(), addMonths(fund.dueAt, -fund.repeatEveryMonths).getTime())
        : fund.createdAt.getTime();
    const totalMs = fund.dueAt.getTime() - cycleStartMs;

    if (totalMs <= 0) {
        return 1;
    }

    return Math.min(Math.max((now.getTime() - cycleStartMs) / totalMs, 0), 1);
};
