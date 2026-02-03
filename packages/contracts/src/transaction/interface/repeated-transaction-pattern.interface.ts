import { UserIconNameEnum } from '../../@generic/enum/user-icon-name.enum';

export interface RepeatedTransactionPatternInterface {
    readonly categoryId: number;
    readonly categoryTitle: string;
    readonly categoryIcon: UserIconNameEnum;
    readonly tagIds: number[];
    readonly title: string;
    readonly averageAmount: number;
    readonly occurrenceCount: number;
    readonly lastOccurrence: Date;
}
