import { UserIconNameEnum } from '../../@generic/enum/user-icon-name.enum';

export interface RepeatedTransactionPatternInterface {
    categoryId: number;
    categoryTitle: string;
    categoryIcon: UserIconNameEnum;
    tagIds: number[];
    title: string;
    averageAmount: number;
    occurrenceCount: number;
    lastOccurrence: Date;
}
