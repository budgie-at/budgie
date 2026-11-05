import type { RecurringLinkedChargeInterface } from './recurring-linked-charge.interface';
import type { RecurringSeriesRowInterface } from './recurring-series-row.interface';

export interface RecurringReadModelInterface {
    readonly series: RecurringSeriesRowInterface;
    readonly links: readonly RecurringLinkedChargeInterface[];
}
