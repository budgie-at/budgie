import { AccountTypeEnum, TransactionAssociationEnum, TransactionTypeEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';

import { isDefined } from '@rnw-community/shared';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const CATEGORIZABLE_TYPES = new Set([TransactionTypeEnum.EXPENSE, TransactionTypeEnum.INCOME]);

export const isUncategorizedTransaction = (
    transaction: Pick<
        TransactionWithRelationsEntityInterface,
        'type' | TransactionAssociationEnum.ENTRIES | TransactionAssociationEnum.DEBT_EVENTS
    >
): boolean => {
    const categoryEntries = getTransactionCategoryEntries(transaction.entries);
    const primaryEntry = categoryEntries.at(0);

    return (
        CATEGORIZABLE_TYPES.has(transaction.type) &&
        isDefined(primaryEntry) &&
        primaryEntry.account.type !== AccountTypeEnum.DEBT &&
        !isDefined(transaction.debtEvents.at(0)) &&
        categoryEntries.every(entry => !isDefined(entry.category))
    );
};
