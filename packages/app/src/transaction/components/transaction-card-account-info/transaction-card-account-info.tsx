import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TransactionAccountLine } from '../transaction-account-line/transaction-account-line';
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
    const fromAccountTestID = isTransfer ? TransactionCardSelector.FromAccount : TransactionCardSelector.Account;
    const toAccountTestID = isTransfer ? TransactionCardSelector.ToAccount : TransactionCardSelector.Account;

    if (!isDefined(visibleFromAccount) && !isDefined(visibleToAccount)) {
        return null;
    }

    return (
        <View className="gap-y-xs">
            {isDefined(visibleFromAccount) ? (
                <TransactionAccountLine
                    direction="from"
                    icon={visibleFromAccount.icon}
                    title={visibleFromAccount.title}
                    testID={fromAccountTestID(visibleFromAccount.title)}
                />
            ) : null}

            {isDefined(visibleToAccount) ? (
                <TransactionAccountLine
                    direction="to"
                    icon={visibleToAccount.icon}
                    title={visibleToAccount.title}
                    testID={toAccountTestID(visibleToAccount.title)}
                />
            ) : null}
        </View>
    );
};
