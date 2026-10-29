import type { BudgetCategoryLimitCreateEntityInterface } from '@budgie/contracts';

export type BudgetCategoryLimitInputInterface = Pick<
    BudgetCategoryLimitCreateEntityInterface,
    'categoryId' | 'limitAmount' | 'rolloverMode'
>;
