import type { RecurringSeriesInterface } from './recurring-series.interface';
import type { RecurringSeriesUserStateEnum } from '@budgie/contracts';

export interface RecurringTrackedSeriesInterface extends RecurringSeriesInterface {
    readonly seriesId: number;
    readonly userState: RecurringSeriesUserStateEnum;
}
