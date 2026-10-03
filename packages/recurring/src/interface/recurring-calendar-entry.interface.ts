import type { RecurringAlertEnum } from '../enum/recurring-alert.enum';
import type { RecurringSeriesUserStateEnum, UserIconType } from '@budgie/contracts';

export interface RecurringCalendarEntryInterface {
    readonly key: string;
    readonly seriesId: number;
    readonly userState: RecurringSeriesUserStateEnum;
    readonly alert: RecurringAlertEnum | null;
    readonly categoryId: number | null;
    readonly categoryTitle: string | null;
    readonly categoryIcon: UserIconType | null;
    readonly title: string;
    readonly latestAmount: number;
    readonly latestTransactionId: number | null;
    readonly dayOfMonth: number;
    readonly accountId: number;
    readonly isForecast: boolean;
}
