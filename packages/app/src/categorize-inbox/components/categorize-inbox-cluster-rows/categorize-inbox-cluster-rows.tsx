import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { testID } from '../../../@generic/utils/test-id.util';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxClusterRow } from '../categorize-inbox-cluster-row/categorize-inbox-cluster-row';

import { CategorizeInboxClusterRowsSelector } from './categorize-inbox-cluster-rows.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'key' | 'displayTitle' | 'rows'>;
}

export const CategorizeInboxClusterRows = ({ cluster }: Props) => {
    const { t } = useLingui();
    const { expandedClusterKey, excludedTransactionIds, toggleExpanded } = useCategorizeInboxContext();

    const handleTogglePress = (): void => void toggleExpanded(cluster.key);

    const isExpanded = expandedClusterKey === cluster.key;
    const skippedCount = cluster.rows.filter(row => excludedTransactionIds.has(row.transactionId)).length;
    const reviewText = t({ message: plural(cluster.rows.length, { one: 'Review # transaction', other: 'Review # transactions' }) });
    const skippedText = isPositiveNumber(skippedCount)
        ? t({ message: plural(skippedCount, { one: '# skipped', other: '# skipped' }) })
        : null;
    const chevronIcon = isExpanded ? UserIconNameEnum.ChevronUp : UserIconNameEnum.ChevronDown;
    const accessibilityState = { expanded: isExpanded };

    return (
        <View className="border-t border-secondary-corner pt-md">
            <HapticPressable
                onPress={handleTogglePress}
                className="flex-row items-center gap-x-sm"
                accessibilityRole="button"
                accessibilityState={accessibilityState}
                {...testID(CategorizeInboxClusterRowsSelector.Toggle, cluster.key)}
            >
                <Text className="text-secondary-foreground text-xs font-medium">{reviewText}</Text>
                <Text className="text-warning-foreground text-xs font-medium flex-1">{skippedText}</Text>
                <Icon icon={chevronIcon} size={16} className="text-secondary-foreground" />
            </HapticPressable>

            {isExpanded ? (
                <View className="pt-sm">
                    {cluster.rows.map(row => (
                        <CategorizeInboxClusterRow key={row.transactionId} row={row} displayTitle={cluster.displayTitle} />
                    ))}
                </View>
            ) : null}
        </View>
    );
};
