/* eslint-disable lingui/no-unlocalized-strings */
import { TransactionTypeEnum } from '@budgie/contracts';

import { IconName } from '../../@generic/constant/icons.constant';

export const TRANSACTION_ICON: Record<TransactionTypeEnum, IconName> = {
    [TransactionTypeEnum.TRANSFER]: 'ArrowRightLeft',
    [TransactionTypeEnum.INCOME]: 'TrendingUp',
    [TransactionTypeEnum.DEBT]: 'CreditCard',
    [TransactionTypeEnum.EXPENSE]: 'TrendingDown',
    [TransactionTypeEnum.ADJUSTMENT]: 'Coins',
};
