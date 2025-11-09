import { RefinementCtx } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { BaseTransferTransactionCreateEntityInterface } from '../entity/base-transfer-transaction-create-entity.interface';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

interface Options {
    sameAccount: boolean;
    sameInstrument: boolean;
    stableExchangeRate: boolean;
}

export const transferTransactionRefine = <T extends BaseTransferTransactionCreateEntityInterface>(
    { entries, exchangeRate, fromAccountId, toAccountId }: T,
    context: RefinementCtx,
    options: Options
) => {
    const fromAccount = entries.find(entry => entry.amount < 0);
    const toAccount = entries.find(entry => entry.amount > 0);

    if (!isDefined(fromAccountId) || !isDefined(toAccountId)) {
        context.addIssue({
            code: 'custom',
            path: [TransactionAssociationEnum.ENTRIES],
            message: 'buy asset transaction entries must have from and to account ids'
        });

        return;
    }

    if (!isDefined(fromAccount) || !isDefined(toAccount)) {
        context.addIssue({
            code: 'custom',
            path: [TransactionAssociationEnum.ENTRIES],
            message: 'buy asset transaction entries must have from and to accounts'
        });

        return;
    }

    if (fromAccount.accountId !== fromAccountId) {
        context.addIssue({
            code: 'custom',
            path: [TransactionAssociationEnum.ENTRIES],
            message: 'buy asset transaction entries must have the same from account id'
        });

        return;
    }

    if (toAccount.accountId !== toAccountId) {
        context.addIssue({
            code: 'custom',
            path: [TransactionAssociationEnum.ENTRIES],
            message: 'buy asset transaction entries must have the same to account id'
        });
    }

    const { sameAccount, stableExchangeRate, sameInstrument } = options;

    if (sameAccount && fromAccount.accountId !== toAccount.accountId) {
        context.addIssue({
            code: 'custom',
            path: [TransactionAssociationEnum.ENTRIES],
            message: 'buy asset transaction entries must have the same accounts'
        });

        return;
    }

    if (!sameAccount && fromAccount.accountId === toAccount.accountId) {
        context.addIssue({
            code: 'custom',
            path: [TransactionAssociationEnum.ENTRIES],
            message: 'buy asset transaction entries must have different accounts'
        });

        return;
    }

    if (sameInstrument && fromAccount.instrumentId !== toAccount.instrumentId) {
        context.addIssue({
            code: 'custom',
            path: [TransactionAssociationEnum.ENTRIES],
            message: 'buy asset transaction entries must have the same instrument'
        });

        return;
    }

    if (!sameInstrument && fromAccount.instrumentId === toAccount.instrumentId) {
        context.addIssue({
            code: 'custom',
            path: [TransactionAssociationEnum.ENTRIES],
            message: 'buy asset transaction entries must have different instruments'
        });

        return;
    }

    if (stableExchangeRate && exchangeRate !== 1) {
        context.addIssue({
            code: 'custom',
            path: ['exchangeRate'],
            message: 'buy asset transaction exchange rate must be 1'
        });

        return;
    }

    if (!stableExchangeRate && exchangeRate <= 1) {
        context.addIssue({
            code: 'custom',
            path: ['exchangeRate'],
            message: 'buy asset transaction exchange rate must be > 1'
        });
    }
};
