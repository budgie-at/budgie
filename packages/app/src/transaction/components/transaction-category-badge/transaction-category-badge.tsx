import { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly transaction: TransactionWithRelationsEntityInterface;
}

export const TransactionCategoryBadge = ({ transaction }: Props) => {
    const { t } = useLingui();

    const className = 'bg-secondary-background self-start py-xxs px-md rounded-2xl';
    const textClassName = 'text-xs font-medium text-primary';

    if (transaction.entries.length > 1) {
        return (
            <View className={className}>
                <Icon icon={ICONS.SplitIcon} className="text-primary" size={12} />

                <Text className={textClassName}>{t`Categories`}</Text>
            </View>
        );
    }

    const title = transaction.entries.at(0)?.category?.title ?? '';

    return (
        <View className={className}>
            <Text className={textClassName}>{title}</Text>
        </View>
    );
};
