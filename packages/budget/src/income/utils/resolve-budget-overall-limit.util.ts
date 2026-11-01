import { BudgetLimitSourceEnum } from '@budgie/contracts';

export const resolveBudgetOverallLimit = (
    limitSource: BudgetLimitSourceEnum,
    fixedLimit: number,
    incomeReceived: number,
    incomeExpected: number
): number => {
    if (limitSource === BudgetLimitSourceEnum.INCOME_RECEIVED) {
        return incomeReceived;
    }

    if (limitSource === BudgetLimitSourceEnum.INCOME_EXPECTED) {
        return Math.max(incomeExpected, incomeReceived);
    }

    return fixedLimit;
};
