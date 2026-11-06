import type { RecurringChargeInterface } from './recurring-charge.interface';
import type { RecurringSeriesTransactionEntityInterface } from '@budgie/contracts';

export interface RecurringLinkedChargeInterface {
    readonly link: RecurringSeriesTransactionEntityInterface;
    readonly charge: RecurringChargeInterface;
}
