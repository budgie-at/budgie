import {
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum,
    UserIconType,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';

export const getTransactionIcon = (transaction: TransactionWithRelationsEntityInterface): UserIconType => {
    if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
        return isPositiveAdjustmentTransaction(transaction) ? UserIconNameEnum.BadgePlus : UserIconNameEnum.BadgeMinus;
    }

    if (transaction.type === TransactionTypeEnum.TRANSFER) {
        return UserIconNameEnum.ArrowRightLeft;
    }

    if (transaction.type === TransactionTypeEnum.DEBT) {
        return UserIconNameEnum.HandCoins;
    }

    const categoryEntries = getTransactionCategoryEntries(transaction.entries);

    if (categoryEntries.length > 1) {
        return UserIconNameEnum.Split;
    }

    return categoryEntries.at(0)?.category?.icon ?? UserIconNameEnum.CircleDashed;
};
