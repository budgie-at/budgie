import { AccountTypeEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';

import { HomeSectionKindEnum } from '../enum/home-section-kind.enum';

import { CryptoCurrencyGroupInterface } from './crypto-currency-group.interface';

export interface AccountTypeSectionInterface {
    readonly kind: HomeSectionKindEnum.ACCOUNT_TYPE;
    readonly type: AccountTypeEnum;
    readonly data: Array<AccountWithSyncEntityInterface | CryptoCurrencyGroupInterface>;
}
