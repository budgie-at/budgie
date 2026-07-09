import { TransactionEntryTypeEnum } from '@budgie/contracts';
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
    const selectedAccountEntry = transaction.entries.find(entry => entry.accountId === accountId);

    if (
        isDefined(selectedAccountEntry) &&
        selectedAccountEntry.accountId !== transaction.fromAccountId &&
        selectedAccountEntry.accountId !== transaction.toAccountId
    ) {
        const selectedAccountDirection = selectedAccountEntry.type === TransactionEntryTypeEnum.CREDIT ? 'from' : 'to';

        return (
            <TransactionAccountLine
                direction={selectedAccountDirection}
                icon={selectedAccountEntry.account.icon}
                title={selectedAccountEntry.account.title}
                testID={TransactionCardSelector.Account(selectedAccountEntry.account.title)}
            />
        );
    }

    if (isDefined(fromAccount) && isDefined(toAccount)) {
        return (
            <View className="gap-y-xs flex-1">
                <TransactionAccountLine
                    direction="from"
                    icon={fromAccount.icon}
                    title={fromAccount.title}
                    testID={TransactionCardSelector.FromAccount(fromAccount.title)}
                />
                <TransactionAccountLine
                    direction="to"
                    icon={toAccount.icon}
                    title={toAccount.title}
                    testID={TransactionCardSelector.ToAccount(toAccount.title)}
                />
            </View>
        );
    }

    if (isDefined(fromAccount)) {
        return (
            <TransactionAccountLine
                direction="from"
                icon={fromAccount.icon}
                title={fromAccount.title}
                testID={TransactionCardSelector.Account(fromAccount.title)}
            />
        );
    }

    if (isDefined(toAccount)) {
        return (
            <TransactionAccountLine
                direction="to"
                icon={toAccount.icon}
                title={toAccount.title}
                testID={TransactionCardSelector.Account(toAccount.title)}
            />
        );
    }

    return null;
};
