import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

export interface BudgetFundCloseStateInterface {
    readonly fund: BudgetSinkingFundEntityInterface;
    readonly consumed: number;
    readonly isFinished: boolean;
}
