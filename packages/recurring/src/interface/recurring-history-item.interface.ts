import type { RecurringMatchSourceEnum } from '@budgie/contracts';

export interface RecurringHistoryItemInterface {
    readonly transactionId: number;
    readonly operatedAt: Date;
    readonly amount: number;
    readonly nativeAmount: number;
    readonly instrumentId: number;
    readonly isExcluded: boolean;
    readonly matchedBy: RecurringMatchSourceEnum;
}
