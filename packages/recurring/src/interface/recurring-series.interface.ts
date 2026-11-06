import type { RecurringCadenceInterface } from './recurring-cadence.interface';
import type { RecurringSeriesEventInterface } from './recurring-series-event.interface';
import type { RecurringSeriesKindEnum } from '@budgie/contracts';

export interface RecurringSeriesInterface extends RecurringCadenceInterface {
    readonly kind: RecurringSeriesKindEnum;
    readonly instrumentId: number;
    readonly nativeAmount: number;
    readonly merchantKey: string;
    readonly labels: readonly string[];
    readonly title: string;
    readonly categoryId: number | null;
    readonly anchorTimestamp: number;
    readonly events: readonly RecurringSeriesEventInterface[];
}
