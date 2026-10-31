import type { BudgetSinkingFundEntityInterface } from './budget-sinking-fund-entity.interface';

export type BudgetSinkingFundCreateEntityInterface = Pick<
    BudgetSinkingFundEntityInterface,
    'budgetId' | 'name' | 'categoryId' | 'targetAmount' | 'dueAt'
> &
    Partial<Pick<BudgetSinkingFundEntityInterface, 'repeatEveryMonths' | 'recurringSeriesId' | 'fundedAmount' | 'lastFundedPeriodStart'>>;
