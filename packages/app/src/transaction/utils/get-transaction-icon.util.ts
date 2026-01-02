import {
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    UserIconNameEnum
} from '@budgie/contracts';

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

    if (transaction.entries.length > 1) {
        return UserIconNameEnum.Split;
    }

    return transaction.entries.at(0)?.category?.icon ?? UserIconNameEnum.Home;
};
