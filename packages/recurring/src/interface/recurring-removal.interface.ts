import type { RecurringSeriesSourceEnum, RecurringSeriesUserStateEnum } from '@budgie/contracts';

export interface RecurringRemovalInterface {
    readonly seriesId: number;
    readonly source: RecurringSeriesSourceEnum;
    readonly previousUserState: RecurringSeriesUserStateEnum;
}
