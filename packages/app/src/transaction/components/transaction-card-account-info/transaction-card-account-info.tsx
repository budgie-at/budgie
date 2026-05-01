import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TransactionAccountLine } from '../transaction-account-line/transaction-account-line';
import { TransactionCardSelector } from '../transaction-card/transaction-card.selector';

import type { TransactionCardAccountInfoPropsInterface } from '../../interface/transaction-card-account-info-props.interface';

export const TransactionCardAccountInfo = ({ transaction }: TransactionCardAccountInfoPropsInterface) => {
    const { toAccount, fromAccount } = transaction;

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
