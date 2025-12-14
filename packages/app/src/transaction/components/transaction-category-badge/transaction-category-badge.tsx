import { TransactionEntryWithRelationsEntityInterface, TransactionTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { Icon } from '../../../@generic/components/icon/icon';
import { ICONS } from '../../../@generic/constant/icons.constant';

interface Props {
    readonly entries: TransactionEntryWithRelationsEntityInterface[];
    readonly type: TransactionTypeEnum;
}

const wrapperClassName = 'bg-secondary-corner self-start py-xxs px-md rounded-2xl flex-row';
const textClassName = 'text-xs font-medium text-primary';

export const TransactionCategoryBadge = ({ entries, type }: Props) => {
    const { t } = useLingui();

    const [firstEntry, ...otherEntries] = entries;

    if (type === TransactionTypeEnum.ADJUSTMENT) {
        return (
            <View className={wrapperClassName}>
                <Text className={textClassName}>{t`Balance Adjustment`}</Text>
            </View>
        );
    }

    if (isNotEmptyArray(otherEntries)) {
        return (
            <View className={wrapperClassName}>
                <Icon icon={ICONS.SplitIcon} className="text-primary" size={12} />

                <Text className={textClassName}>{t`Categories`}</Text>
            </View>
        );
    }

    return (
        <View className={wrapperClassName}>
            <Text className={textClassName}>{firstEntry.category?.title ?? ''}</Text>
        </View>
    );
};
