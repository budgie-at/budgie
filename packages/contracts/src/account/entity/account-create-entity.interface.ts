import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { PartialByKeysType } from '../../@generic/type/partial-by-keys.type';
import type { AccountEntityInterface } from './account-entity.interface';

export type AccountCreateEntityInterface = PartialByKeysType<
    Omit<AccountEntityInterface, BaseEntityKeyType | 'titleSearch'>,
    | 'iban'
    | 'debtType'
    | 'deadline'
    | 'parentId'
    | 'contactId'
    | 'externalId'
    | 'targetBalance'
    | 'targetBaseInstrumentId'
    | 'targetBaseExchangeRate'
    | 'targetBaseAmount'
    | 'interestRate'
    | 'externalSource'
    | 'integrationId'
    | 'includeInNetWorth'
    | 'isActive'
>;
