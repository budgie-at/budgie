import type { AccountBalanceCreateEntityInterface } from './account-balance-create-entity.interface';

export type AccountBalanceUpdateEntityInterface = Pick<AccountBalanceCreateEntityInterface, 'amount'>;
