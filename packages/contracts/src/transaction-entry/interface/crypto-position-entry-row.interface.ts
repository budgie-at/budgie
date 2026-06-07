import type { TransactionEntryTypeEnum } from '../enum/transaction-entry-type.enum';

export interface CryptoPositionEntryRowInterface {
    readonly type: TransactionEntryTypeEnum;
    readonly amount: number;
    readonly baseAmount: number | null;
}
