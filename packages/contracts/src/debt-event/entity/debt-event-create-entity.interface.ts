import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { PartialByKeysType } from '../../@generic/type/partial-by-keys.type';
import type { DebtEventEntityInterface } from './debt-event-entity.interface';

export type DebtEventCreateEntityInterface = PartialByKeysType<
    Omit<DebtEventEntityInterface, BaseEntityKeyType>,
    'transactionId' | 'transactionEntryId' | 'baseInstrumentId' | 'baseExchangeRate' | 'baseAmount' | 'operatedAt'
>;
