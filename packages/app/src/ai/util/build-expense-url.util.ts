import { Href } from 'expo-router';

import { isDefined, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { GroupedTransactionInterface } from './group-transactions-by-category.util';

export const buildExpenseUrl = (transaction: GroupedTransactionInterface, defaultAccountId: number | undefined): Href => {
    const params = new URLSearchParams();
    const accountId = transaction.account?.id ?? defaultAccountId;

    if (isPositiveNumber(transaction.amount)) {
        params.set('amount', String(transaction.amount));
    }
    if (isPositiveNumber(transaction.categoryId)) {
        params.set('categoryId', String(transaction.categoryId));
    }
    if (isDefined(accountId)) {
        params.set('accountId', String(accountId));
    }
    if (isDefined(transaction.currency)) {
        params.set('currency', transaction.currency);
    }
    if (isNotEmptyString(transaction.comment)) {
        params.set('comment', transaction.comment);
    }
    if (isNotEmptyArray(transaction.entries)) {
        params.set('entries', JSON.stringify(transaction.entries));
    }

    const queryString = params.toString();

    return isNotEmptyString(queryString) ? `/create-transaction/expense?${queryString}` : '/create-transaction/expense';
};
