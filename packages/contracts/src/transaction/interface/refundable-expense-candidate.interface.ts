import type { UserIconType } from '../../@generic/type/user-icon.type';
import type { TransactionTypeEnum } from '../enum/transaction-type.enum';

export interface RefundableExpenseCandidateInterface {
    readonly id: number;
    readonly type: TransactionTypeEnum.EXPENSE;
    readonly title: string;
    readonly comment: string;
    readonly operatedAt: Date;
    readonly amount: number;
    readonly accountTitle: string;
    readonly currencyCode: string;
    readonly currencySymbol: string;
    readonly categoryTitle: string | null;
    readonly categoryTitleEn: string | null;
    readonly categoryIcon: UserIconType | null;
    readonly isRecommended: boolean;
}
