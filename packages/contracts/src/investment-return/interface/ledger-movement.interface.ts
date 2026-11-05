import type { TransactionEntryTypeEnum } from '../../transaction-entry/enum/transaction-entry-type.enum';
import type { TransactionTypeEnum } from '../../transaction/enum/transaction-type.enum';

export interface LedgerMovementInterface {
    readonly accountId: number;
    readonly entryType: TransactionEntryTypeEnum;
    readonly amount: number;
    readonly operatedAt: Date;
    readonly transactionType: TransactionTypeEnum;
    readonly fromAccountId: number | null;
    readonly toAccountId: number | null;
    readonly fundAccountId: number | null;
}
