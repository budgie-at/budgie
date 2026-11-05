import type { RecurringHistoryItemInterface } from './recurring-history-item.interface';
import type { RecurringSeriesListItemInterface } from './recurring-series-list-item.interface';

export interface RecurringSeriesDetailInterface {
    readonly series: RecurringSeriesListItemInterface;
    readonly nextDates: readonly Date[];
    readonly history: readonly RecurringHistoryItemInterface[];
}
