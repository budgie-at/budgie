import { CategoryEntityInterface } from '@budgie/contracts';

import { BudgetStatusEnum } from '../enum/budget-status.enum';

export interface BudgetCategoryStatusInterface {
    readonly category: CategoryEntityInterface;
    readonly limit: number;
    readonly spent: number;
    readonly remaining: number;
    readonly percentage: number;
    readonly status: BudgetStatusEnum;
}
