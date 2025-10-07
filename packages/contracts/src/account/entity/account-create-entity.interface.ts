import { AccountEntityInterface } from './account-entity.interface';

const AccountCreateEntityFields = [] as const;

export interface AccountCreateEntityInterface extends Pick<AccountEntityInterface, (typeof AccountCreateEntityFields)[number]> {}
