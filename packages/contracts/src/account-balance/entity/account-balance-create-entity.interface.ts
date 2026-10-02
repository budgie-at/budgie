import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { AccountBalanceEntityInterface } from './account-balance-entity.interface';

export type AccountBalanceCreateEntityInterface = Omit<AccountBalanceEntityInterface, BaseEntityKeyType>;
