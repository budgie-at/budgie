import type { BudgetSinkingFundCreateEntityInterface } from './budget-sinking-fund-create-entity.interface';

export type BudgetSinkingFundUpdateEntityInterface = Partial<
    Pick<
        BudgetSinkingFundCreateEntityInterface,
        'name' | 'categoryId' | 'targetAmount' | 'dueAt' | 'repeatEveryMonths' | 'fundedAmount' | 'lastFundedPeriodStart'
    >
>;
