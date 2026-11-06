import type { RecurringSeriesTransactionEntityInterface } from './recurring-series-transaction-entity.interface';

export type RecurringSeriesTransactionCreateEntityInterface = Pick<
    RecurringSeriesTransactionEntityInterface,
    'seriesId' | 'transactionId' | 'cycleDate' | 'matchedBy'
> &
    Partial<Pick<RecurringSeriesTransactionEntityInterface, 'isExcluded'>>;
