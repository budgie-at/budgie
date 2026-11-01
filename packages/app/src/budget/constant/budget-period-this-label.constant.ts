import { BudgetPeriodEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const BUDGET_PERIOD_THIS_LABEL: Record<BudgetPeriodEnum, MessageDescriptor> = {
    [BudgetPeriodEnum.WEEKLY]: msg`this week`,
    [BudgetPeriodEnum.BIWEEKLY]: msg`these two weeks`,
    [BudgetPeriodEnum.MONTHLY]: msg`this month`,
    [BudgetPeriodEnum.YEARLY]: msg`this year`
};
