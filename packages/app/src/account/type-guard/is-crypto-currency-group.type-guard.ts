import { isNotEmptyArray } from '@rnw-community/shared';

import { AccountRowInterface } from '../interface/account-row.interface';
import { CryptoCurrencyGroupInterface } from '../interface/crypto-currency-group.interface';

export const isCryptoCurrencyGroup = (item: AccountRowInterface | CryptoCurrencyGroupInterface): item is CryptoCurrencyGroupInterface =>
    'accounts' in item && isNotEmptyArray(item.accounts);
