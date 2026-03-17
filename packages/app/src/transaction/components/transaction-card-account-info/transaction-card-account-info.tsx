import { AccountEntityInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { TransactionCardSelectors } from '../../../@e2e/selectors/transaction-card.selector';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardAccountInfo = ({ transaction }: Props) => {
    const { toAccount, fromAccount } = transaction;

    if (isDefined(fromAccount) && isDefined(toAccount)) {
        return (
            <View className="gap-y-xs flex-1">
                <View className="flex-row items-center gap-x-sm" testID={TransactionCardSelectors.FromAccount(fromAccount.title)}>
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>from</Trans>
                    </Text>
                    <Icon icon={fromAccount.icon} className="text-secondary-foreground" size={12} />
                    <Text className="text-xs font-medium text-secondary-foreground flex-1" numberOfLines={1}>
                        {fromAccount.title}
                    </Text>
                </View>
                <View className="flex-row items-center gap-x-sm" testID={TransactionCardSelectors.ToAccount(toAccount.title)}>
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>to</Trans>
                    </Text>
                    <Icon icon={toAccount.icon} className="text-secondary-foreground" size={12} />
                    <Text className="text-xs font-medium text-secondary-foreground flex-1" numberOfLines={1}>
                        {toAccount.title}
                    </Text>
                </View>
            </View>
        );
    }

    if (isDefined(fromAccount) || isDefined(toAccount)) {
        const account = isDefined(fromAccount) ? fromAccount : (toAccount as AccountEntityInterface);

        return (
            <View className="flex-row items-center gap-x-sm flex-1" testID={TransactionCardSelectors.Account(account.title)}>
                <Icon icon={account.icon} className="text-secondary-foreground" size={12} />
                <Text className="text-xs font-medium text-secondary-foreground flex-1" numberOfLines={1}>
                    {account.title}
                </Text>
            </View>
        );
    }

    return null;
};
