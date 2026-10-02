import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { PartialByKeysType } from '../../@generic/type/partial-by-keys.type';
import type { TransactionEntryEntityInterface } from './transaction-entry-entity.interface';

export type TransactionEntryCreateEntityInterface = PartialByKeysType<
    Omit<TransactionEntryEntityInterface, BaseEntityKeyType>,
    | 'categorySource'
    | 'kind'
    | 'externalId'
    | 'exchangeRate'
    | 'baseInstrumentId'
    | 'baseExchangeRate'
    | 'baseAmount'
    | 'quotedInstrumentId'
    | 'quotedAmount'
    | 'quotedUnitPrice'
    | 'toIban'
    | 'originalTransactionId'
>;
