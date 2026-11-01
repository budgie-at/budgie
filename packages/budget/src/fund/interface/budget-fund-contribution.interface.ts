import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

export type BudgetFundContributionInterface = Pick<BudgetSinkingFundEntityInterface, 'fundedAmount' | 'lastFundedPeriodStart'>;
