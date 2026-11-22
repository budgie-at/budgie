import type { RecurringCadenceInterface } from './recurring-cadence.interface';
import type { RecurringSeriesEventInterface } from './recurring-series-event.interface';

export interface RecurringStreamInterface {
    readonly cadence: RecurringCadenceInterface;
    readonly events: readonly RecurringSeriesEventInterface[];
    readonly anchorTimestamp: number;
    readonly confidence: number;
}
