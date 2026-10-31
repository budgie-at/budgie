import { BudgetPeriodEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const BUDGET_PERIOD_TITLE_LABEL: Record<BudgetPeriodEnum, MessageDescriptor> = {
    [BudgetPeriodEnum.WEEKLY]: msg`Weekly budget`,
    [BudgetPeriodEnum.BIWEEKLY]: msg`Two-week budget`,
    [BudgetPeriodEnum.MONTHLY]: msg`Monthly budget`,
    [BudgetPeriodEnum.YEARLY]: msg`Yearly budget`
};
