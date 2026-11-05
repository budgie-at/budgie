import type { RecurringSeriesSourceEnum } from '@budgie/contracts';

export interface RecurringRemovalInterface {
    readonly seriesId: number;
    readonly source: RecurringSeriesSourceEnum;
}
