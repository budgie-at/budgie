import {
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction,
    isTransferTransaction
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const wrapperClassName = 'bg-secondary-corner self-start py-xxs px-md rounded-2xl flex-row';
const textClassName = 'text-xs font-medium text-primary';

export const TransactionCategoryBadge = ({ transaction }: Props) => {
    const { t, i18n } = useLingui();

    if (isTransferTransaction(transaction)) {
        const [entry] = transaction.entries;
        const category = entry.category?.title ?? i18n.t(TRANSACTION_TYPE[transaction.type]);

        return (
            <View className={wrapperClassName}>
                <Text className={textClassName}>{category}</Text>
            </View>
        );
    }

    if (isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction)) {
        return (
            <View className={wrapperClassName}>
                <Text className={textClassName}>{t`Balance Adjustment`}</Text>
            </View>
        );
    }

    if (transaction.entries.length > 1) {
        return (
            <View className={wrapperClassName}>
                <Icon icon={ICONS.SplitIcon} className="text-primary" size={12} />

                <Text className={textClassName}>{t`Categories`}</Text>
            </View>
        );
    }

    const [entry] = transaction.entries;
    const category = entry.category?.title ?? i18n.t(TRANSACTION_TYPE[transaction.type]);

    return (
        <View className={wrapperClassName}>
            <Text className={textClassName}>{category}</Text>
        </View>
    );
};
