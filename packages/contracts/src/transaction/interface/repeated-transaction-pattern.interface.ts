import type { UserIconType } from '../../@generic/type/user-icon.type';

export interface RepeatedTransactionPatternInterface {
    readonly categoryId: number;
    readonly categoryTitle: string;
    readonly categoryIcon: UserIconType;
    readonly tagIds: number[];
    readonly title: string;
    readonly comment: string | null;
    readonly latestAmount: number;
    readonly occurrenceCount: number;
    readonly lastOccurrence: Date;
    readonly accountId: number;
    readonly instrumentId: number;
    readonly accountIsActive: boolean;
    readonly accountDeletedAt: Date | null;
}
