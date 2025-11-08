import { RefinementCtx } from 'zod';

import { isDefined } from '@rnw-community/shared';

import { TransactionEntryCreateEntityInterface } from '../../transaction-entry/entity/transaction-entry-create-entity.interface';

interface Options {
    sameAccount: boolean;
    sameInstrument: boolean;
    stableExchangeRate: boolean;
}

export const transferTransactionRefine = (
    entries: TransactionEntryCreateEntityInterface[],
    exchangeRate: number,
    context: RefinementCtx,
    options: Options
) => {
    const fromAccount = entries.find(entry => entry.amount < 0);
    const toAccount = entries.find(entry => entry.amount > 0);

    if (!isDefined(fromAccount) || !isDefined(toAccount)) {
        context.addIssue({
            code: 'custom',
            path: ['entries'],
            message: 'buy asset transaction entries must have from and to accounts'
        });

        return;
    }

    const { sameAccount, stableExchangeRate, sameInstrument } = options;

    if (sameAccount && fromAccount.accountId !== toAccount.accountId) {
        context.addIssue({
            code: 'custom',
            path: ['entries'],
            message: 'buy asset transaction entries must have the same accounts'
        });

        return;
    }

    if (!sameAccount && fromAccount.accountId === toAccount.accountId) {
        context.addIssue({
            code: 'custom',
            path: ['entries'],
            message: 'buy asset transaction entries must have different accounts'
        });

        return;
    }

    if (sameInstrument && fromAccount.instrumentId !== toAccount.instrumentId) {
        context.addIssue({
            code: 'custom',
            path: ['entries'],
            message: 'buy asset transaction entries must have the same instrument'
        });

        return;
    }

    if (!sameInstrument && fromAccount.instrumentId === toAccount.instrumentId) {
        context.addIssue({
            code: 'custom',
            path: ['entries'],
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
