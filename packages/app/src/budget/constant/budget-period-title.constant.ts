import { BudgetPeriodEnum } from '@budgie/contracts';
import { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';

export const BUDGET_PERIOD_TITLE: Record<BudgetPeriodEnum, MessageDescriptor> = {
    [BudgetPeriodEnum.WEEKLY]: msg`Weekly Budget`,
    [BudgetPeriodEnum.BI_WEEKLY]: msg`Bi-Weekly Budget`,
    [BudgetPeriodEnum.MONTHLY]: msg`Monthly Budget`
};
