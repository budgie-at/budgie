/* eslint-disable lingui/no-unlocalized-strings */
import { TransactionTypeEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

import { IconName } from '../../@generic/constant/icons.constant';

export const getTransactionIcon = (transaction: TransactionWithRelationsEntityInterface): IconName => {
    if (transaction.type === TransactionTypeEnum.TRANSFER) {
        return 'ArrowRightLeft';
    }

    if (transaction.entries.length > 1) {
        return 'SplitIcon';
    }

    return transaction.entries.at(0)?.category?.icon ?? 'Home';
};
