import type { RecurringSeriesEventInterface } from './recurring-series-event.interface';
import type { UserIconType } from '@budgie/contracts';

export interface RecurringSeriesInterface {
    readonly title: string;
    readonly categoryId: number | null;
    readonly categoryTitle: string | null;
    readonly categoryIcon: UserIconType | null;
    readonly accountId: number;
    readonly periodMonths: number | null;
    readonly periodDays: number;
    readonly anchorTimestamp: number;
    readonly predictedAmount: number;
    readonly events: readonly RecurringSeriesEventInterface[];
}
