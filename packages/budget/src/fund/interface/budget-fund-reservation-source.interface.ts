import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

export type BudgetFundReservationSourceInterface = Pick<
    BudgetSinkingFundEntityInterface,
    'id' | 'categoryId' | 'targetAmount' | 'fundedAmount' | 'dueAt'
>;
