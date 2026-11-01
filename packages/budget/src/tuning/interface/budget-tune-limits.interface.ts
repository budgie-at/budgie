import type { BudgetCategoryLimitEntityInterface } from '@budgie/contracts';

export interface BudgetTuneLimitsInterface {
    readonly overallLimit: number;
    readonly otherLimit: number;
    readonly otherLimitUserEditedAt: Date | null;
    readonly categories: readonly Pick<BudgetCategoryLimitEntityInterface, 'categoryId' | 'limitAmount' | 'userEditedAt'>[];
}
