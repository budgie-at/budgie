import { DebtEventAssociationEnum, TransactionAssociationEnum, TransactionTypeEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { getTransactionDisplayTitle } from './get-transaction-display-title.util';

import type { TransactionCounterpartyInterface } from '../interface/transaction-counterparty.interface';
import type { AccountEntityInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const getTransactionCounterparty = (
    transaction: Pick<
        TransactionWithRelationsEntityInterface,
        | 'type'
        | 'title'
        | 'comment'
        | TransactionAssociationEnum.FROM_ACCOUNT
        | TransactionAssociationEnum.TO_ACCOUNT
        | TransactionAssociationEnum.DEBT_EVENTS
    >,
    accountId: number | null
): TransactionCounterpartyInterface | null => {
    const debtAccount = transaction.debtEvents.at(0)?.[DebtEventAssociationEnum.DEBT_ACCOUNT];
    const moneyAccount = transaction.fromAccount ?? transaction.toAccount;
    const displayTitle = getTransactionDisplayTitle(transaction);
    const getVisibleTitle = (account: Pick<AccountEntityInterface, 'id' | 'title'>) =>
        account.id === accountId ||
        (isDefined(accountId) ? displayTitle.toLowerCase() === account.title.toLowerCase() : displayTitle.includes(account.title))
            ? null
            : account.title;
    const toCounterparty = (
        source: Pick<AccountEntityInterface, 'id' | 'title'>,
        destination: Pick<AccountEntityInterface, 'id' | 'title'>
    ): TransactionCounterpartyInterface | null => {
        const sourceTitle = getVisibleTitle(source);
        const destinationTitle = getVisibleTitle(destination);

        return isDefined(sourceTitle) || isDefined(destinationTitle) ? { source: sourceTitle, destination: destinationTitle } : null;
    };

    if (isDefined(debtAccount) && isDefined(moneyAccount)) {
        const isIncome = transaction.type === TransactionTypeEnum.INCOME;

        return isIncome ? toCounterparty(debtAccount, moneyAccount) : toCounterparty(moneyAccount, debtAccount);
    }

    if (isDefined(transaction.fromAccount) && isDefined(transaction.toAccount)) {
        return toCounterparty(transaction.fromAccount, transaction.toAccount);
    }

    return null;
};
