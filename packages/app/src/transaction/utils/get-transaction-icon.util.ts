/* eslint-disable lingui/no-unlocalized-strings */
import {
    TransactionExpenseWithRelationsEntityInterface,
    TransactionIncomeWithRelationsEntityInterface,
    TransactionTransferWithRelationsEntityInterface,
    TransactionTypeEnum
} from '@budgie/contracts';

import { IconName } from '../../@generic/constant/icons.constant';

type Transaction =
    | TransactionIncomeWithRelationsEntityInterface
    | TransactionTransferWithRelationsEntityInterface
    | TransactionExpenseWithRelationsEntityInterface;

export const getTransactionIcon = (transaction: Transaction): IconName => {
    if (transaction.type === TransactionTypeEnum.TRANSFER) {
        return 'ArrowRightLeft';
    }

    if (transaction.entries.length > 1) {
        return 'SplitIcon';
    }

    return transaction.entries[0].category.icon;
};
