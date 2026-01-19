import { BudgetEntityInterface, BudgetPeriodEnum } from '@budgie/contracts';
import { addDays, addMonths, addWeeks, isBefore, startOfDay } from 'date-fns';
import { useState } from 'react';

import { emptyFn, isDefined } from '@rnw-community/shared';

interface UseBudgetPeriodNavigationResultInterface {
    readonly startDate: Date;
    readonly endDate: Date;
    readonly isCurrentPeriod: boolean;
    readonly handlePrevious: () => void;
    readonly handleNext: () => void;
}

const PERIOD_DURATION_MAP: Record<BudgetPeriodEnum, number> = {
    [BudgetPeriodEnum.WEEKLY]: 7,
    [BudgetPeriodEnum.BI_WEEKLY]: 14,
    [BudgetPeriodEnum.MONTHLY]: 0
};

const addPeriods = (date: Date, period: BudgetPeriodEnum, count: number): Date => {
    if (period === BudgetPeriodEnum.WEEKLY) {
        return addWeeks(date, count);
    }

    if (period === BudgetPeriodEnum.BI_WEEKLY) {
        return addWeeks(date, count * 2);
    }

    return addMonths(date, count);
};

const calculatePeriodEndDate = (startDate: Date, period: BudgetPeriodEnum): Date => {
    const duration = PERIOD_DURATION_MAP[period];

    if (duration > 0) {
        return addDays(startDate, duration - 1);
    }

    return addDays(addMonths(startDate, 1), -1);
};

const DEFAULT_DATE = new Date();
const DEFAULT_RESULT: UseBudgetPeriodNavigationResultInterface = {
    startDate: DEFAULT_DATE,
    endDate: DEFAULT_DATE,
    isCurrentPeriod: true,
    handlePrevious: emptyFn,
    handleNext: emptyFn
};

export const useBudgetPeriodNavigation = (budget: BudgetEntityInterface | null | undefined): UseBudgetPeriodNavigationResultInterface => {
    const [periodOffset, setPeriodOffset] = useState(0);

    if (!isDefined(budget)) {
        return DEFAULT_RESULT;
    }

    const startDate = addPeriods(budget.startDate, budget.period, periodOffset);
    const endDate = calculatePeriodEndDate(startDate, budget.period);
    const today = startOfDay(new Date());
    const isCurrentPeriod = !isBefore(endDate, today) && !isBefore(today, startDate);

    const handlePrevious = () => void setPeriodOffset(periodOffset - 1);
    const handleNext = () => void setPeriodOffset(periodOffset + 1);

    return {
        startDate,
        endDate,
        isCurrentPeriod,
        handlePrevious,
        handleNext
    };
};
