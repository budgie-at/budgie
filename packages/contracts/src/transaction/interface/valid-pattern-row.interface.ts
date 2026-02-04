import { UserIconNameEnum } from '../../@generic/enum/user-icon-name.enum';

export interface ValidPatternRowInterface {
    readonly categoryId: number;
    readonly categoryTitle: string;
    readonly categoryIcon: UserIconNameEnum;
    readonly title: string;
    readonly comment: string | null;
    readonly averageAmount: number;
    readonly occurrenceCount: number;
    readonly lastOccurrence: number;
    readonly accountId: number;
    readonly instrumentId: number;
    readonly accountIsActive: boolean;
    readonly accountDeletedAt: number | null;
}
