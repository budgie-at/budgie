import { AccountTypeEnum } from '@budgie/contracts';

import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';

import { AccountRowInterface } from './account-row.interface';
import { CryptoCurrencyGroupInterface } from './crypto-currency-group.interface';

export interface AccountTypeSectionInterface {
    readonly kind: HomeSectionKindEnum.ACCOUNT_TYPE;
    readonly type: AccountTypeEnum;
    readonly data: Array<AccountRowInterface | CryptoCurrencyGroupInterface>;
}
