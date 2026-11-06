import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

export interface RecurringSummaryInterface {
    readonly committedMonthly: number;
    readonly committedCount: number;
    readonly hasAveragedBills: boolean;
    readonly nextPayment: Pick<RecurringSeriesListItemInterface, 'title' | 'amount' | 'nextDate'> | null;
    readonly incomeMonthly: number;
}
