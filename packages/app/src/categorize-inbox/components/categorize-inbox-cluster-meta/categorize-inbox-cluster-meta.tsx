import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxClusterCardSelector } from '../categorize-inbox-cluster-card/categorize-inbox-cluster-card.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxClusterMeta = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { formatMonthAndDay } = useFormatDate();
    const { expandedClusterKey, excludedTransactionIds, toggleExpanded } = useCategorizeInboxContext();

    const handleTogglePress = (): void => void toggleExpanded(cluster.key);

    const isExpanded = expandedClusterKey === cluster.key;
    const { displayTitle } = cluster;
    const [oldestLabel, newestLabel] = [Math.min, Math.max].map(pick =>
        formatMonthAndDay(new Date(pick(...cluster.rows.map(row => row.operatedAt.getTime()))))
    );
    const dateText = oldestLabel === newestLabel ? oldestLabel : `${oldestLabel} – ${newestLabel}`;
    const countText = t({ message: plural(cluster.rows.length, { one: '# transaction', other: '# transactions' }) });
    const skippedCount = cluster.rows.filter(row => excludedTransactionIds.has(row.transactionId)).length;
    const skippedText = isPositiveNumber(skippedCount)
        ? ` · ${t({ message: plural(skippedCount, { one: '# skipped', other: '# skipped' }) })}`
        : '';
    const chevronIcon = isExpanded ? UserIconNameEnum.ChevronUp : UserIconNameEnum.ChevronDown;
    const toggleLabel = isExpanded ? t`Hide transactions for ${displayTitle}` : t`Show transactions for ${displayTitle}`;
    const accessibilityState = { expanded: isExpanded };

    return (
        <HapticPressable
            onPress={handleTogglePress}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            accessibilityLabel={toggleLabel}
            {...testID(CategorizeInboxClusterCardSelector.Toggle, cluster.key)}
        >
            <View className="flex-row items-center gap-x-xs">
                <Text className="text-secondary-foreground text-xs shrink tabular-nums" numberOfLines={1}>
                    {`${countText} · ${dateText}`}
                    <Text className="text-warning-foreground">{skippedText}</Text>
                </Text>
                <Icon icon={chevronIcon} size={14} className="text-secondary-foreground" />
            </View>
        </HapticPressable>
    );
};
