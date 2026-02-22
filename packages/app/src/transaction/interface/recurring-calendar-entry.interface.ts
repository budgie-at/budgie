import { UserIconNameEnum } from '@budgie/contracts';

export interface RecurringCalendarEntryInterface {
    readonly categoryId: number;
    readonly categoryTitle: string;
    readonly categoryIcon: UserIconNameEnum;
    readonly title: string;
    readonly latestAmount: number;
    readonly occurrenceCount: number;
    readonly dayOfMonth: number;
    readonly accountId: number;
    readonly instrumentId: number;
}
