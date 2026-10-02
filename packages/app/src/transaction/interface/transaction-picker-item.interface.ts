import type { TransactionTypeEnum, UserIconType } from '@budgie/contracts';

export interface TransactionPickerItemInterface {
    readonly id: number;
    readonly type: TransactionTypeEnum.EXPENSE | TransactionTypeEnum.INCOME;
    readonly title: string;
    readonly operatedAt: Date;
    readonly amount: number;
    readonly accountTitle: string;
    readonly currencySymbol: string;
    readonly categoryTitle: string | null;
    readonly categoryIcon: UserIconType | null;
    readonly isRecommended: boolean;
}
