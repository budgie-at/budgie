import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
    readonly categoryLabel: string;
}

const wrapperClassName = 'bg-secondary-corner self-start py-xxs px-md rounded-2xl flex-row gap-xs items-center';
const textClassName = 'text-xs font-medium text-primary';

export const TransactionCategoryBadgePure = ({ transaction, categoryLabel }: Props) => {
    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);
    const hasMultipleEntries = transaction.entries.length > 1;

    if (isAdjustment) {
        return (
            <View className={wrapperClassName}>
                <Text className={textClassName}>{categoryLabel}</Text>
            </View>
        );
    }

    if (hasMultipleEntries) {
        return (
            <View className={wrapperClassName}>
                <Icon icon={ICONS.SplitIcon} className="text-primary" size={12} />
                <Text className={textClassName}>{categoryLabel}</Text>
            </View>
        );
    }

    return (
        <View className={wrapperClassName}>
            <Text className={textClassName}>{categoryLabel}</Text>
        </View>
    );
};
