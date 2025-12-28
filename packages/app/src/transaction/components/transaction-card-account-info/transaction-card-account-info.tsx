import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardAccountInfo = ({ transaction }: Props) => {
    const { toAccount, fromAccount } = transaction;

    if (isDefined(fromAccount) && isDefined(toAccount)) {
        return (
            <View className="flex-row items-center gap-x-sm flex-1">
                <Icon icon={fromAccount.icon} className="text-secondary-foreground" size={12} />
                <Text className="text-xs font-medium text-secondary-foreground max-w-1/2" numberOfLines={1}>
                    {fromAccount.title}
                </Text>

                <Icon icon="ArrowRightIcon" className="text-secondary-foreground" size={12} />

                <Icon icon={toAccount.icon} className="text-secondary-foreground" size={12} />
                <Text className="text-xs font-medium text-secondary-foreground max-w-1/2" numberOfLines={1}>
                    {toAccount.title}
                </Text>
            </View>
        );
    }

    if (isDefined(fromAccount)) {
        return (
            <View className="flex-row items-center gap-x-sm flex-1">
                <Text className="text-xs text-secondary-foreground">from</Text>
                <Icon icon={fromAccount.icon} className="text-secondary-foreground" size={12} />
                <Text className="text-xs font-medium text-secondary-foreground flex-1" numberOfLines={1}>{fromAccount.title}</Text>
            </View>
        );
    }

    if (isDefined(toAccount)) {
        return (
            <View className="flex-row items-center gap-x-sm flex-1">
                <Text className="text-xs text-secondary-foreground">to</Text>
                <Icon icon={toAccount.icon} className="text-secondary-foreground" size={12} />
                <Text className="text-xs font-medium text-secondary-foreground flex-1" numberOfLines={1}>{toAccount.title}</Text>
            </View>
        );
    }

    return null;
};
