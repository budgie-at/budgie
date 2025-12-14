/* eslint-disable lingui/no-unlocalized-strings */
import { AccountTypeEnum } from '@budgie/contracts';

import { IconName } from '../../@generic/constant/icons.constant';

export const ACCOUNT_ICON: Record<AccountTypeEnum, IconName> = {
    [AccountTypeEnum.BANK]: 'CreditCard',
    [AccountTypeEnum.CASH]: 'Wallet',
    [AccountTypeEnum.DEBT]: 'CreditCard',
    [AccountTypeEnum.CRYPTO]: 'Coins',
    [AccountTypeEnum.STOCKS]: 'CreditCard',
    [AccountTypeEnum.SAVINGS]: 'Coins'
};
