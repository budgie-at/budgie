import type { TransactionEntryEntityInterface } from '@budgie/contracts';

export type FeeEntrySourceInterface = Pick<
    TransactionEntryEntityInterface,
    | 'transactionId'
    | 'accountId'
    | 'categoryId'
    | 'categorySource'
    | 'mccCategoryId'
    | 'amount'
    | 'exchangeRate'
    | 'baseInstrumentId'
    | 'baseExchangeRate'
    | 'baseAmount'
>;
