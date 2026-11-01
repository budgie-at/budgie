import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

export type BudgetFundSettleSourceInterface = Pick<
    BudgetSinkingFundEntityInterface,
    'id' | 'categoryId' | 'fundedAmount' | 'dueAt' | 'repeatEveryMonths'
>;
