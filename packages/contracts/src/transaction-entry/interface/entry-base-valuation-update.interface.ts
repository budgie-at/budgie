import type { TransactionEntryEntityInterface } from '../entity/transaction-entry-entity.interface';

export type EntryBaseValuationUpdateInterface = Pick<
    TransactionEntryEntityInterface,
    'id' | 'baseInstrumentId' | 'baseExchangeRate' | 'baseAmount'
>;
