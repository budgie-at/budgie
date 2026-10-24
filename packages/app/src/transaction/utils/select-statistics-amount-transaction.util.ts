import { TransactionTypeEnum } from '@budgie/contracts';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const selectStatisticsAmountTransaction = (
    transaction: TransactionWithRelationsEntityInterface,
    categoryIds: number[] | null
): TransactionWithRelationsEntityInterface => {
    const isIncomeOrExpense = transaction.type === TransactionTypeEnum.EXPENSE || transaction.type === TransactionTypeEnum.INCOME;

    if (!isIncomeOrExpense || !isNotEmptyArray(categoryIds)) {
        return transaction;
    }

    const entries = transaction.entries.filter(entry => isDefined(entry.categoryId) && categoryIds.includes(entry.categoryId));

    return isNotEmptyArray(entries) ? { ...transaction, entries } : transaction;
};
