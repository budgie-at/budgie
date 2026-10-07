import { AccountWithSyncEntityInterface } from '@budgie/contracts';

import { AccountRowInterface } from '../interface/account-row.interface';
import { CryptoCurrencyGroupInterface } from '../interface/crypto-currency-group.interface';

export const isAccountItem = (
    item: AccountRowInterface | CryptoCurrencyGroupInterface | AccountWithSyncEntityInterface
): item is AccountWithSyncEntityInterface => 'type' in item;
