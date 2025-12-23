import {
    isExpenseTransaction,
    isIncomeTransaction,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCardAccountInfo = ({ transaction }: Props) => {
    const { toAccount, fromAccount } = transaction;

    if (isIncomeTransaction(transaction) || isPositiveAdjustmentTransaction(transaction)) {
        const { title, icon } = transaction.toAccount;

        return (
            <View className="flex-row items-center gap-x-md">
                <Text className="text-secondary-foreground text-sm">
                    <Trans>to</Trans>
                </Text>
                <Icon icon={ICONS[icon]} className="text-secondary-foreground" size={12} />
                <Text className="text-secondary-foreground text-sm">{title}</Text>
            </View>
        );
    }

    if (isExpenseTransaction(transaction) || isNegativeAdjustmentTransaction(transaction)) {
        const { title, icon } = transaction.fromAccount;

        return (
            <View className="flex-row items-center gap-x-md">
                <Text className="text-secondary-foreground text-sm">
                    <Trans>from</Trans>
                </Text>
                <Icon icon={ICONS[icon]} className="text-secondary-foreground" size={12} />
                <Text className="text-secondary-foreground text-sm">{title}</Text>
            </View>
        );
    }

    if (isDefined(fromAccount) && isDefined(toAccount)) {
        return (
            <View className="py-xxs px-md rounded-2xl border border-secondary-corner flex-row items-center gap-x-sm mb-8">
                <Text className="text-xs font-medium text-primary">{fromAccount.title}</Text>
                <Icon icon={ICONS.ArrowRightIcon} className="text-primary" size={10} />
                <Text className="text-xs font-medium text-primary">{toAccount.title}</Text>
            </View>
        );
    }

    const accountTitle = toAccount?.title ?? fromAccount?.title;

    if (isNotEmptyString(accountTitle)) {
        return (
            <Text className="text-xs font-medium text-primary py-xxs px-md rounded-2xl border border-secondary-corner">{accountTitle}</Text>
        );
    }

    return null;
};
