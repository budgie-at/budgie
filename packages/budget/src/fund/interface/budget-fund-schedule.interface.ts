import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

export type BudgetFundScheduleInterface = Pick<BudgetSinkingFundEntityInterface, 'targetAmount' | 'fundedAmount' | 'dueAt'>;
