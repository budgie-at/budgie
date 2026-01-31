import { Href } from 'expo-router';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { GroupedVoiceTransactionInterface } from '../service/voice-llm.service';

export const buildExpenseUrl = (transaction: GroupedVoiceTransactionInterface, defaultAccountId: number | undefined): Href => {
    const params = new URLSearchParams();
    const accountId = transaction.account?.id ?? defaultAccountId;

    if (isPositiveNumber(transaction.amount)) {
        params.set('amount', String(transaction.amount));
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

    const queryString = params.toString();

    return isNotEmptyString(queryString) ? `/create-transaction/expense?${queryString}` : '/create-transaction/expense';
};
