import { BudgetPeriodEnum } from '@budgie/contracts';

type TranslateFunction = (strings: TemplateStringsArray, ...values: unknown[]) => string;

export const getStartDayLabel = (period: BudgetPeriodEnum, t: TranslateFunction): string => {
    if (period === BudgetPeriodEnum.WEEKLY || period === BudgetPeriodEnum.BI_WEEKLY) {
        return t`Start Day of Week`;
    }

    if (period === BudgetPeriodEnum.YEARLY) {
        return t`Start Month`;
    }

    if (period === BudgetPeriodEnum.QUARTERLY) {
        return t`Start Month of Quarter`;
    }

    return t`Start Day of Month`;
};

