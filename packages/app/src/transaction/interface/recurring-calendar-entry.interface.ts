import { UserIconNameEnum } from '@budgie/contracts';

export interface RecurringCalendarEntryInterface {
    readonly categoryId: number | null;
    readonly categoryTitle: string | null;
    readonly categoryIcon: UserIconNameEnum | null;
    readonly title: string;
    readonly latestAmount: number;
    readonly latestTransactionId: number;
    readonly occurrenceCount: number;
    readonly dayOfMonth: number;
    readonly accountId: number;
    readonly instrumentId: number;
}
