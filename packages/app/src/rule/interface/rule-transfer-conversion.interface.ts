import type { TransactionEntryEntityInterface, TransactionTypeEnum, TransactionWithEntriesEntityInterface } from '@budgie/contracts';

export interface RuleTransferConversionInterface {
    readonly transaction: TransactionWithEntriesEntityInterface;
    readonly originalEntry: TransactionEntryEntityInterface;
    readonly fromAccountId: number;
    readonly toAccountId: number;
    readonly convertedAmount: number;
    readonly exchangeRate: number;
    readonly transactionType: TransactionTypeEnum;
}
