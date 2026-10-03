import type { UserIconType } from '@budgie/contracts';

export interface RecurringChargeInterface {
    readonly transactionId: number;
    readonly operatedAt: Date;
    readonly title: string;
    readonly comment: string;
    readonly defaultAmount: number;
    readonly accountId: number;
    readonly categoryId: number | null;
    readonly categoryTitle: string | null;
    readonly categoryIcon: UserIconType | null;
}
