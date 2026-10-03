import type { RecurringSeriesEntityInterface } from './recurring-series-entity.interface';

export type RecurringSeriesCreateEntityInterface = Pick<
    RecurringSeriesEntityInterface,
    'merchantKey' | 'kind' | 'periodDays' | 'amount' | 'status' | 'userState' | 'title' | 'categoryId' | 'lastSeenAt'
>;
