import { BudgetPeriodEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const getStartDayLabel = (period: BudgetPeriodEnum): MessageDescriptor => {
    if (period === BudgetPeriodEnum.WEEKLY || period === BudgetPeriodEnum.BI_WEEKLY) {
        return msg`Start Day of Week`;
    }

    if (period === BudgetPeriodEnum.YEARLY) {
        return msg`Start Month`;
    }

    if (period === BudgetPeriodEnum.QUARTERLY) {
        return msg`Start Month of Quarter`;
    }

    return msg`Start Day of Month`;
};

