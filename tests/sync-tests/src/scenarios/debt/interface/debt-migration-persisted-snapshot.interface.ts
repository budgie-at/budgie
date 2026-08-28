import type {
    AccountBalanceEntityInterface,
    AccountEntityInterface,
    DebtEventEntityInterface,
    TransactionEntityInterface,
    TransactionEntryEntityInterface
} from '@budgie/contracts';

export interface DebtMigrationPersistedSnapshotInterface {
    readonly accounts: readonly Pick<
        AccountEntityInterface,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
        | 'deletedAt'
        | 'type'
        | 'debtType'
        | 'instrumentId'
        | 'targetBalance'
        | 'targetBaseInstrumentId'
        | 'targetBaseExchangeRate'
        | 'targetBaseAmount'
    >[];
    readonly balances: readonly Pick<
        AccountBalanceEntityInterface,
        'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'accountId' | 'amount'
    >[];
    readonly transactions: readonly Pick<
        TransactionEntityInterface,
        'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'type' | 'operatedAt' | 'toAccountId' | 'fromAccountId' | 'exchangeRate'
    >[];
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
        | 'kind'
        | 'categorySource'
        | 'baseInstrumentId'
        | 'baseExchangeRate'
        | 'baseAmount'
        | 'originalTransactionId'
    >[];
    readonly debtEvents: readonly Pick<
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
    >[];
}

export interface DebtMigrationFirstExecutionSnapshotInterface {
    readonly ambiguous: DebtMigrationPersistedSnapshotInterface;
    readonly canonical: DebtMigrationPersistedSnapshotInterface;
}
