import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { useCategorizeInboxTopSuggestion } from '../../hook/use-categorize-inbox-top-suggestion.hook';
import { CategorizeInboxClusterRowsSelector } from '../categorize-inbox-cluster-rows/categorize-inbox-cluster-rows.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly isExpanded: boolean;
}

export const CategorizeInboxClusterSummary = ({ cluster, isExpanded }: Props) => {
    const { t } = useLingui();
    const { excludedTransactionIds, formatBaseMicroAmount, toggleExpanded } = useCategorizeInboxContext();
    const topSuggestion = useCategorizeInboxTopSuggestion(cluster);

    const handleTogglePress = (): void => void toggleExpanded(cluster.key);

    const countText = t({ message: plural(cluster.rows.length, { one: '# transaction', other: '# transactions' }) });
    const skippedCount = cluster.rows.filter(row => excludedTransactionIds.has(row.transactionId)).length;
    const skippedText = isPositiveNumber(skippedCount)
        ? ` · ${t({ message: plural(skippedCount, { one: '# skipped', other: '# skipped' }) })}`
        : null;
    const amountText = isDefined(cluster.totalBaseAmount) ? formatBaseMicroAmount(cluster.totalBaseAmount) : null;
    const chevronIcon = isExpanded ? UserIconNameEnum.ChevronUp : UserIconNameEnum.ChevronDown;
    const { displayTitle } = cluster;
    const toggleLabel = isExpanded ? t`Hide transactions for ${displayTitle}` : t`Show transactions for ${displayTitle}`;
    const accessibilityState = { expanded: isExpanded };

    return (
        <View className="flex-row items-start gap-x-xl">
            <HapticPressable
                onPress={handleTogglePress}
                className="flex-1 gap-y-xxs"
                accessibilityRole="button"
                accessibilityState={accessibilityState}
                accessibilityLabel={toggleLabel}
                {...topSuggestion?.accessibilityProps}
                {...testID(CategorizeInboxClusterRowsSelector.Toggle, cluster.key)}
            >
                <Text className="text-primary text-sm font-semibold" numberOfLines={1}>
                    {displayTitle}
                </Text>
                <View className="flex-row items-center gap-x-xs">
                    <Text className="text-secondary-foreground text-xs shrink" numberOfLines={1}>
                        {countText}
                        {isDefined(skippedText) ? <Text className="text-warning-foreground">{skippedText}</Text> : null}
                    </Text>
                    <Icon icon={chevronIcon} size={12} className="text-secondary-foreground" />
                </View>
            </HapticPressable>

            {isDefined(amountText) ? <Text className="text-primary text-sm font-semibold">{amountText}</Text> : null}
        </View>
    );
};
