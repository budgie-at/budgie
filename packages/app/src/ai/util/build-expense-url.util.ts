import { Href } from 'expo-router';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { AITransactionInterface } from '../interface/ai-transaction.interface';

export const buildExpenseUrl = (transaction: AITransactionInterface, accountId: number | undefined): Href => {
    const params = new URLSearchParams();

    if (isPositiveNumber(transaction.amount)) {
        params.set('amount', String(transaction.amount));
    }
    if (isDefined(transaction.category)) {
        params.set('categoryId', String(transaction.category.id));
    }
    if (isDefined(accountId)) {
        params.set('accountId', String(accountId));
    }
    if (isNotEmptyString(transaction.comment)) {
        params.set('comment', transaction.comment);
    }

    const queryString = params.toString();

    return isNotEmptyString(queryString) ? `/create-transaction/expense?${queryString}` : '/create-transaction/expense';
};
