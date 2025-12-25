import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardAccountInfo = ({ transaction }: Props) => {
    const { toAccount, fromAccount } = transaction;

    if (isDefined(fromAccount) && isDefined(toAccount)) {
        return (
            <View className="flex-row items-center gap-x-sm mb-8">
                <Icon icon={ICONS[fromAccount.icon]} className="text-secondary-foreground" size={12} />
                <Text className="text-xs font-medium text-primary">{fromAccount.title}</Text>

                <Icon icon={ICONS.ArrowRightIcon} className="text-primary" size={12} />

                <Icon icon={ICONS[toAccount.icon]} className="text-secondary-foreground" size={12} />
                <Text className="text-xs font-medium text-primary">{toAccount.title}</Text>
            </View>
        );
    }

    if (isDefined(fromAccount)) {
        return (
            <View className="flex-row items-center gap-x-sm">
                <Text className="text-xs text-secondary-foreground">from</Text>
                <Icon icon={ICONS[fromAccount.icon]} className="text-secondary-foreground" size={12} />
            </View>
        );
    }

    if (isDefined(toAccount)) {
        return (
            <View className="flex-row items-center gap-x-sm">
                <Text className="text-xs text-secondary-foreground">from</Text>
                <Icon icon={ICONS[toAccount.icon]} className="text-secondary-foreground" size={12} />
            </View>
        );
    }

    return null;
};
