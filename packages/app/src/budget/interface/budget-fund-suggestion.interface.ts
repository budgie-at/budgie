import type { BudgetSinkingFundEntityInterface } from '@budgie/contracts';

export interface BudgetFundSuggestionInterface extends Pick<
    BudgetSinkingFundEntityInterface,
    'name' | 'categoryId' | 'targetAmount' | 'dueAt' | 'repeatEveryMonths'
> {
    readonly recurringSeriesId: number;
}
