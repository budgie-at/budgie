/* eslint-disable lingui/no-unlocalized-strings */
import { AccountDebtTypeEnum } from '@budgie/contracts';
import { IconName } from '../../@generic/constant/icons.constant';

export const ACCOUNT_DEBT_TYPE_ICON: Record<AccountDebtTypeEnum, IconName> = {
    [AccountDebtTypeEnum.LENT]: 'TrendingDown',
    [AccountDebtTypeEnum.BORROW]: 'TrendingUp'
};
