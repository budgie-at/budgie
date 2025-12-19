import {
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction,
    isTransferTransaction,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';
import { TRANSACTION_TYPE } from '../../constant/transaction-type.constant';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

const wrapperClassName = 'bg-secondary-corner self-start py-xxs px-md rounded-2xl flex-row gap-xs items-center';
const textClassName = 'text-xs font-medium text-primary';

export const TransactionCategoryBadge = ({ transaction }: Props) => {
    const { t, i18n } = useLingui();

    const isAdjustment = isPositiveAdjustmentTransaction(transaction) || isNegativeAdjustmentTransaction(transaction);

    if (isAdjustment) {
        return (
            <View className={wrapperClassName}>
                <Text className={textClassName}>{t`Balance Adjustment`}</Text>
            </View>
        );
    }

    const hasMultipleEntries = transaction.entries.length > 1;

    if (hasMultipleEntries) {
        return (
            <View className={wrapperClassName}>
                <Icon icon={ICONS.SplitIcon} className="text-primary" size={12} />
                <Text className={textClassName}>{t`Categories`}</Text>
            </View>
        );
    }

    const [entry] = transaction.entries;
    const defaultLabel = i18n.t(TRANSACTION_TYPE[transaction.type]);
    const categoryTitle = entry.category?.title ?? defaultLabel;

    const label = isTransferTransaction(transaction) ? categoryTitle : categoryTitle;

    return (
        <View className={wrapperClassName}>
            <Text className={textClassName}>{label}</Text>
        </View>
    );
};
