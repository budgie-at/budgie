import { UserIconNameEnum } from '../../@generic/enum/user-icon-name.enum';

export interface MonthlyPatternRowInterface {
    readonly categoryId: number;
    readonly categoryTitle: string;
    readonly categoryIcon: UserIconNameEnum;
    readonly title: string;
    readonly latestAmount: number;
    readonly occurrenceCount: number;
    readonly lastOccurrence: number;
    readonly dayOfMonth: number;
    readonly accountId: number;
    readonly instrumentId: number;
}
