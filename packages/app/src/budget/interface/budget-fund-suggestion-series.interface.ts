import type { RecurringSeriesEntityInterface } from '@budgie/contracts';

export interface BudgetFundSuggestionSeriesInterface extends Pick<
    RecurringSeriesEntityInterface,
    'id' | 'kind' | 'status' | 'title' | 'categoryId' | 'periodDays' | 'lastSeenAt' | 'endsAt'
> {
    readonly defaultAmount: number;
}
