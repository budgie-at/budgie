import type { BudgetLimitChangeEntityInterface } from './budget-limit-change-entity.interface';

export type BudgetLimitChangeCreateEntityInterface = Pick<
    BudgetLimitChangeEntityInterface,
    'budgetId' | 'categoryId' | 'previousAmount' | 'newAmount' | 'reason' | 'periodsObserved' | 'periodStart'
>;
