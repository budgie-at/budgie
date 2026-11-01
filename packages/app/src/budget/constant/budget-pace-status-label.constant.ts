import { BudgetPaceStatusEnum } from '@budgie/budget';
import { msg } from '@lingui/core/macro';

import type { MessageDescriptor } from '@lingui/core';

export const BUDGET_PACE_STATUS_LABEL: Record<BudgetPaceStatusEnum, MessageDescriptor> = {
    [BudgetPaceStatusEnum.ON_TRACK]: msg`On track`,
    [BudgetPaceStatusEnum.TOO_EARLY]: msg`On track`,
    [BudgetPaceStatusEnum.AHEAD]: msg`Ahead of pace`,
    [BudgetPaceStatusEnum.OVER]: msg`Over budget`
};
