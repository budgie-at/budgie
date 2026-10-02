import type { UserIconType } from '../../@generic/type/user-icon.type';

export interface PatternRowInterface {
    readonly categoryId: number | null;
    readonly categoryTitle: string | null;
    readonly categoryIcon: UserIconType | null;
    readonly title: string;
    readonly comment: string | null;
    readonly occurrenceCount: number;
    readonly lastOccurrence: number;
    readonly accountId: number;
    readonly instrumentId: number;
    readonly accountIsActive: boolean;
    readonly accountDeletedAt: number | null;
}
