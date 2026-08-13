import type { TransactionConsolidationTypeEnum, TransactionEntryEntityInterface, TransactionTypeEnum } from '@budgie/contracts';

export interface SourceStateSnapshotInterface {
    readonly consolidationType: TransactionConsolidationTypeEnum | null;
    readonly entries: readonly Pick<
        TransactionEntryEntityInterface,
        'accountId' | 'amount' | 'categoryId' | 'exchangeRate' | 'mccCategoryId' | 'toIban' | 'type'
    >[];
    readonly exchangeRate: number;
    readonly fromAccountId: number | null;
    readonly tagIds: readonly number[];
    readonly toAccountId: number | null;
    readonly transactionId: number;
    readonly type: TransactionTypeEnum;
}
