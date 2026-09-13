import { UserIconNameEnum } from '../../@generic/enum/user-icon-name.enum';

export interface RecurringChargeCandidateInterface {
    readonly transactionId: number;
    readonly operatedAt: Date;
    readonly title: string;
    readonly comment: string;
    readonly defaultAmount: number;
    readonly accountId: number;
    readonly categoryId: number;
    readonly categoryTitle: string;
    readonly categoryIcon: UserIconNameEnum;
}
