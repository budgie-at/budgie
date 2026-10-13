import type { RecurringSeriesKindEnum, UserIconType } from '@budgie/contracts';

export interface RecurringChargeInterface {
    readonly kind: RecurringSeriesKindEnum;
    readonly nativeAmount: number;
    readonly instrumentId: number;
    readonly counterpartyIban: string | null;
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
