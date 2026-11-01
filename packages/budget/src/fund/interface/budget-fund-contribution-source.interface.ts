import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

export type BudgetFundContributionSourceInterface = Pick<
    BudgetSinkingFundEntityInterface,
    'targetAmount' | 'fundedAmount' | 'dueAt' | 'createdAt' | 'lastFundedPeriodStart'
>;
