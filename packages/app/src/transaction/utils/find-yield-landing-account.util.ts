import { TransactionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const findYieldLandingAccount = (transaction: TransactionWithRelationsEntityInterface) => {
    const landingAccountId = transaction.type === TransactionTypeEnum.EXPENSE ? transaction.fromAccountId : transaction.toAccountId;

    return isDefined(landingAccountId) ? (transaction.entries.find(entry => entry.account.id === landingAccountId)?.account ?? null) : null;
};
