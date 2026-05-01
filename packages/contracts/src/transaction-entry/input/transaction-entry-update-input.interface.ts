import type { TransactionEntryCreateEntityInterface } from '../entity/transaction-entry-create-entity.interface';

export type TransactionEntryUpdateInputInterface = Partial<
    Pick<
        TransactionEntryCreateEntityInterface,
        | 'transactionId'
        | 'accountId'
        | 'categoryId'
        | 'mccCategoryId'
        | 'type'
        | 'amount'
        | 'externalId'
        | 'exchangeRate'
        | 'toIban'
        | 'originalTransactionId'
    >
>;
