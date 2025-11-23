import { AnyTransactionWithRelationsEntityType, isExpenseTransaction, isIncomeTransaction, isTransferTransaction } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly transaction: AnyTransactionWithRelationsEntityType;
}

export const TransactionCardAccountInfo = ({ transaction }: Props) => {
    if (isTransferTransaction(transaction)) {
        return (
            <View className="py-xxs px-md rounded-2xl border border-secondary-corner flex-row items-center gap-x-sm">
                <Text className="text-xs font-medium text-primary">{transaction.fromAccount.title}</Text>
                <Icon icon={ICONS.ArrowRightIcon} size={12} className="text-primary" />
                <Text className="text-xs font-medium text-primary">{transaction.toAccount.title}</Text>
            </View>
        );
    }

    if (isIncomeTransaction(transaction)) {
        return (
            <Text className="text-xs font-medium text-primary py-xxs px-md rounded-2xl border border-secondary-corner">
                {transaction.toAccount.title}
            </Text>
        );
    }

    if (isExpenseTransaction(transaction)) {
        return (
            <Text className="text-xs font-medium text-primary py-xxs px-md rounded-2xl border border-secondary-corner">
                {transaction.fromAccount.title}
            </Text>
        );
    }

    return null;
};
