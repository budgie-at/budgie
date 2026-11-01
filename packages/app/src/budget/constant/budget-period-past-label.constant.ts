import { BudgetPeriodEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const BUDGET_PERIOD_PAST_LABEL: Record<BudgetPeriodEnum, MessageDescriptor> = {
    [BudgetPeriodEnum.WEEKLY]: msg`Past weeks`,
    [BudgetPeriodEnum.BIWEEKLY]: msg`Past two-week periods`,
    [BudgetPeriodEnum.MONTHLY]: msg`Past months`,
    [BudgetPeriodEnum.YEARLY]: msg`Past years`
};
