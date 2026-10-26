import { TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const selectStatisticsAmountTransaction = (
    transaction: TransactionWithRelationsEntityInterface,
    categoryIds: number[] | null
): TransactionWithRelationsEntityInterface => {
    if (transaction.type === TransactionTypeEnum.ADJUSTMENT || !isNotEmptyArray(categoryIds)) {
        return transaction;
    }

    const entries = transaction.entries.filter(entry => isDefined(entry.categoryId) && categoryIds.includes(entry.categoryId));

    return isNotEmptyArray(entries) ? { ...transaction, entries } : transaction;
};
