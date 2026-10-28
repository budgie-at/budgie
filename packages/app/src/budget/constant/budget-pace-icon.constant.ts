import { BudgetPaceStatusEnum } from '@budgie/budget';
import { UserIconNameEnum } from '@budgie/contracts';

import type { UserIconType } from '@budgie/contracts';

export const BUDGET_PACE_ICON: Record<BudgetPaceStatusEnum, UserIconType> = {
    [BudgetPaceStatusEnum.ON_TRACK]: UserIconNameEnum.CircleCheck,
    [BudgetPaceStatusEnum.TOO_EARLY]: UserIconNameEnum.CircleCheck,
    [BudgetPaceStatusEnum.AHEAD]: UserIconNameEnum.TrendingUp,
    [BudgetPaceStatusEnum.OVER]: UserIconNameEnum.CircleAlert
};
