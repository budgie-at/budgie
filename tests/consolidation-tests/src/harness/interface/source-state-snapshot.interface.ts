import type { TransactionConsolidationTypeEnum, TransactionEntryEntityInterface, TransactionTypeEnum } from '@budgie/contracts';

export interface SourceStateSnapshotInterface {
    readonly comment: string;
    readonly consolidationType: TransactionConsolidationTypeEnum | null;
    readonly entries: readonly Pick<
        TransactionEntryEntityInterface,
        'accountId' | 'amount' | 'categoryId' | 'categorySource' | 'exchangeRate' | 'mccCategoryId' | 'toIban' | 'type'
    >[];
    readonly exchangeRate: number;
    readonly fromAccountId: number | null;
    readonly tagIds: readonly number[];
    readonly toAccountId: number | null;
    readonly transactionId: number;
    readonly type: TransactionTypeEnum;
}
