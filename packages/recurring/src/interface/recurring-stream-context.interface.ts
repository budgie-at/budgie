import type { RecurringSeriesEventInterface } from './recurring-series-event.interface';

export interface RecurringStreamContextInterface {
    readonly isVariable: boolean;
    readonly hasIban: boolean;
    readonly isIsolatedPair: boolean;
    readonly merchantEvents: readonly RecurringSeriesEventInterface[];
}
