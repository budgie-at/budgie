import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { BankIntegrationEntityInterface } from './bank-integration-entity.interface';

export type BankIntegrationCreateEntityInterface = Omit<
    BankIntegrationEntityInterface,
    BaseEntityKeyType | 'label' | 'externalClientId' | 'historyProgress'
> &
    Partial<Pick<BankIntegrationEntityInterface, 'label' | 'externalClientId' | 'historyProgress'>>;
