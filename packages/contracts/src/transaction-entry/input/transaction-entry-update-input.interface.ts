import type { TransactionEntryCreateEntityInterface } from '../entity/transaction-entry-create-entity.interface';

export type TransactionEntryUpdateInputInterface = Partial<
    Pick<
        TransactionEntryCreateEntityInterface,
        | 'transactionId'
        | 'accountId'
        | 'categoryId'
        | 'categorySource'
        | 'mccCategoryId'
        | 'type'
        | 'amount'
        | 'externalId'
        | 'exchangeRate'
        | 'baseInstrumentId'
        | 'baseExchangeRate'
        | 'baseAmount'
        | 'toIban'
        | 'originalTransactionId'
    >
>;
