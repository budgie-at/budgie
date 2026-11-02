import { isDefined } from '@rnw-community/shared';

import { getSingleAccountId } from './get-single-account-id.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getTransactionRowAccountId = (
    transaction: Pick<TransactionWithRelationsEntityInterface, 'fromAccountId' | 'toAccountId'>,
    accountIds: number[] | null
): number | null => {
    const singleAccountId = getSingleAccountId(accountIds);

    if (isDefined(singleAccountId)) {
        return singleAccountId;
    }

    if (!isDefined(accountIds) || !isDefined(transaction.fromAccountId) || !isDefined(transaction.toAccountId)) {
        return null;
    }

    const isFromAccountScoped = accountIds.includes(transaction.fromAccountId);
    const isToAccountScoped = accountIds.includes(transaction.toAccountId);

    if (isFromAccountScoped === isToAccountScoped) {
        return null;
    }

    return isFromAccountScoped ? transaction.fromAccountId : transaction.toAccountId;
};
