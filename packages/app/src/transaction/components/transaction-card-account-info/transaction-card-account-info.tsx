import { UserIconNameEnum } from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { TransactionAccountLine } from '../transaction-account-line/transaction-account-line';
import { TransactionCardSeparator } from '../transaction-card-separator/transaction-card-separator';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly accountId?: number | null;
}

export const TransactionCardAccountInfo = ({ transaction, accountId = null }: Props) => {
    const { toAccount, fromAccount } = transaction;
    const isTransfer = isDefined(fromAccount) && isDefined(toAccount);
    const visibleFromAccount = accountId === transaction.fromAccountId ? null : fromAccount;
    const visibleToAccount = accountId === transaction.toAccountId ? null : toAccount;

    if (!isDefined(visibleFromAccount) && !isDefined(visibleToAccount)) {
        return null;
    }

    const fromAccountTestID = isTransfer ? TransactionCardSelector.FromAccount : TransactionCardSelector.Account;
    const toAccountTestID = isTransfer ? TransactionCardSelector.ToAccount : TransactionCardSelector.Account;

    return (
        <>
            {isDefined(visibleFromAccount) ? (
                <TransactionAccountLine
                    title={visibleFromAccount.title}
                    testID={fromAccountTestID(visibleFromAccount.title)}
                    {...(isTransfer && !isDefined(visibleToAccount) && { arrowIcon: UserIconNameEnum.ArrowLeft })}
                />
            ) : null}

            {isDefined(visibleToAccount) ? (
                <TransactionAccountLine
                    title={visibleToAccount.title}
                    testID={toAccountTestID(visibleToAccount.title)}
                    {...(isTransfer && { arrowIcon: UserIconNameEnum.ArrowRight })}
                />
            ) : null}

            <TransactionCardSeparator />
        </>
    );
};
