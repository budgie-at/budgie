import type { BudgetLimitChangeCreateEntityInterface } from '@budgie/contracts';

export type BudgetLimitProposalInterface = Pick<
    BudgetLimitChangeCreateEntityInterface,
    'categoryId' | 'previousAmount' | 'newAmount' | 'reason' | 'periodsObserved'
>;
