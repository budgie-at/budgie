import { TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { INZHUR_UNATTRIBUTED_DIVIDEND_TITLE } from '../constant/inzhur-unattributed-dividend-title.constant';

import type { TransactionEntityInterface, YieldFieldsInterface } from '@budgie/contracts';

export const buildInzhurYieldFields = (
    transaction: Pick<TransactionEntityInterface, 'type' | 'fundAccountId' | 'title'>
): YieldFieldsInterface | null => {
    if (transaction.type === TransactionTypeEnum.INCOME && isDefined(transaction.fundAccountId)) {
        return { yieldKind: YieldKindEnum.DIVIDEND, yieldSourceAccountId: transaction.fundAccountId };
    }

    if (transaction.type === TransactionTypeEnum.EXPENSE && isDefined(transaction.fundAccountId)) {
        return { yieldKind: YieldKindEnum.TAX, yieldSourceAccountId: transaction.fundAccountId };
    }

    return transaction.type === TransactionTypeEnum.INCOME && transaction.title === INZHUR_UNATTRIBUTED_DIVIDEND_TITLE
        ? { yieldKind: YieldKindEnum.DIVIDEND, yieldSourceAccountId: null }
        : null;
};
