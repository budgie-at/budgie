import type { DebtEventEntityInterface, TransactionEntityInterface, TransactionEntryEntityInterface } from '@budgie/contracts';

export interface LaterDebtTransferSnapshotInterface {
    readonly debtEvent: Pick<
        DebtEventEntityInterface,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
        | 'deletedAt'
        | 'debtAccountId'
        | 'transactionId'
        | 'transactionEntryId'
        | 'direction'
        | 'source'
        | 'amount'
        | 'baseInstrumentId'
        | 'baseExchangeRate'
        | 'baseAmount'
        | 'operatedAt'
    >;
    readonly transaction: Pick<
        TransactionEntityInterface,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
        | 'deletedAt'
        | 'type'
        | 'title'
        | 'externalId'
        | 'operatedAt'
        | 'comment'
        | 'toAccountId'
        | 'fromAccountId'
        | 'exchangeRate'
        | 'externalSource'
        | 'needsEmbedding'
        | 'consolidationParentTransactionId'
        | 'consolidationType'
        | 'updatedBy'
    >;
    readonly transactionEntries: readonly Pick<
        TransactionEntryEntityInterface,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
        | 'deletedAt'
        | 'type'
        | 'accountId'
        | 'categoryId'
        | 'transactionId'
        | 'amount'
        | 'externalId'
        | 'mccCategoryId'
        | 'exchangeRate'
        | 'toIban'
        | 'originalTransactionId'
        | 'categorySource'
        | 'baseInstrumentId'
        | 'baseExchangeRate'
        | 'baseAmount'
        | 'kind'
    >[];
}
