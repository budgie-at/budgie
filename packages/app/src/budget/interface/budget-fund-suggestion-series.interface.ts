import type { RecurringSeriesEntityInterface } from '@budgie/contracts';

export interface BudgetFundSuggestionSeriesInterface extends Pick<
    RecurringSeriesEntityInterface,
    | 'id'
    | 'kind'
    | 'source'
    | 'userState'
    | 'confidence'
    | 'deletedAt'
    | 'lastSeenAt'
    | 'title'
    | 'categoryId'
    | 'periodDays'
    | 'anchorDate'
    | 'cadenceUnit'
    | 'cadenceInterval'
    | 'endsAt'
> {
    readonly defaultAmount: number;
}
