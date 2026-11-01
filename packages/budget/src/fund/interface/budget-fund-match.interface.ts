import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

export type BudgetFundMatchInterface = Pick<BudgetSinkingFundEntityInterface, 'id' | 'categoryId' | 'fundedAmount' | 'dueAt'>;
