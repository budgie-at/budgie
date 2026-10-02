import { UserIconType } from '@budgie/contracts';

export interface RecurringCalendarEntryInterface {
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
