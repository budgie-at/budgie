import { TransactionAssociationEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getTransactionRowAccountId = (
    transaction: Pick<TransactionWithRelationsEntityInterface, 'fromAccountId' | 'toAccountId' | TransactionAssociationEnum.ENTRIES>,
    accountIds: number[] | null
): number | null => {
    if (!isDefined(accountIds)) {
        return null;
    }

    if (accountIds.length === 1) {
        return accountIds[0];
    }

    if (!isDefined(transaction.fromAccountId) || !isDefined(transaction.toAccountId)) {
        return null;
    }

    const isFromAccountScoped = accountIds.includes(transaction.fromAccountId);
    const isToAccountScoped = accountIds.includes(transaction.toAccountId);

    if (isFromAccountScoped !== isToAccountScoped) {
        return isFromAccountScoped ? transaction.fromAccountId : transaction.toAccountId;
    }

    if (isFromAccountScoped) {
        return null;
    }

    const scopedEntryAccountIds = [
        ...new Set(transaction.entries.map(entry => entry.accountId).filter(accountId => accountIds.includes(accountId)))
    ];

    return scopedEntryAccountIds.length === 1 ? scopedEntryAccountIds[0] : null;
};
