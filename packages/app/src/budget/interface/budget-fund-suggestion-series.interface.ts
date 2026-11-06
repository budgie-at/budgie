import type { RecurringSeriesEntityInterface } from '@budgie/contracts';

export interface BudgetFundSuggestionSeriesInterface extends Pick<
    RecurringSeriesEntityInterface,
    'id' | 'kind' | 'status' | 'title' | 'categoryId' | 'periodDays' | 'anchorDate' | 'cadenceUnit' | 'cadenceInterval' | 'endsAt'
> {
    readonly defaultAmount: number;
}
