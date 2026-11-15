import { TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import type { TransactionEntityInterface, YieldFieldsInterface } from '@budgie/contracts';

export const buildInzhurYieldFields = (
    transaction: Pick<TransactionEntityInterface, 'type' | 'fundAccountId'>,
    isUnattributed: boolean
): YieldFieldsInterface | null => {
    if (transaction.type === TransactionTypeEnum.INCOME && isDefined(transaction.fundAccountId)) {
        return { yieldKind: YieldKindEnum.DIVIDEND, yieldSourceAccountId: transaction.fundAccountId };
    }

    if (transaction.type === TransactionTypeEnum.EXPENSE && isDefined(transaction.fundAccountId)) {
        return { yieldKind: YieldKindEnum.TAX, yieldSourceAccountId: transaction.fundAccountId };
    }

    return transaction.type === TransactionTypeEnum.INCOME && isUnattributed
        ? { yieldKind: YieldKindEnum.DIVIDEND, yieldSourceAccountId: null }
        : null;
};
