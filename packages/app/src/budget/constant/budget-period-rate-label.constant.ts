import { BudgetPeriodEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const BUDGET_PERIOD_RATE_LABEL: Record<BudgetPeriodEnum, MessageDescriptor> = {
    [BudgetPeriodEnum.WEEKLY]: msg`a week`,
    [BudgetPeriodEnum.BIWEEKLY]: msg`every two weeks`,
    [BudgetPeriodEnum.MONTHLY]: msg`a month`,
    [BudgetPeriodEnum.YEARLY]: msg`a year`
};
