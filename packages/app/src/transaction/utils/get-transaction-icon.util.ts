import {
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum
} from '@budgie/contracts';

import { getTransactionCategoryEntries } from './get-transaction-category-entries.util';

export const getTransactionIcon = (transaction: TransactionWithRelationsEntityInterface): UserIconNameEnum => {
    if (transaction.type === TransactionTypeEnum.ADJUSTMENT) {
        const [entry] = transaction.entries;

        return entry.type === TransactionEntryTypeEnum.DEBIT ? UserIconNameEnum.BadgeMinus : UserIconNameEnum.BadgePlus;
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

    return categoryEntries.at(0)?.category?.icon ?? UserIconNameEnum.Home;
};
