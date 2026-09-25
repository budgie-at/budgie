import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxClusterRowsSelector } from '../categorize-inbox-cluster-rows/categorize-inbox-cluster-rows.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';

interface Props {
    readonly cluster: Pick<CategorizeInboxClusterInterface, 'key' | 'displayTitle' | 'totalBaseAmount' | 'rows'>;
    readonly countText: string;
    readonly icon?: UserIconNameEnum;
}

export const CategorizeInboxClusterSummary = ({ cluster, countText, icon }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const protectAmount = useProtectedAmountLabel();
    const { expandedClusterKey, excludedTransactionIds, toggleExpanded } = useCategorizeInboxContext();

    const handleTogglePress = (): void => void toggleExpanded(cluster.key);

    const isExpanded = expandedClusterKey === cluster.key;
    const skippedCount = cluster.rows.filter(row => excludedTransactionIds.has(row.transactionId)).length;
    const skippedText = isPositiveNumber(skippedCount)
        ? ` · ${t({ message: plural(skippedCount, { one: '# skipped', other: '# skipped' }) })}`
        : null;
    const amountText = isDefined(cluster.totalBaseAmount)
        ? protectAmount(convertFromMicroUnits(cluster.totalBaseAmount), defaultInstrument.symbol)
        : null;
    const chevronIcon = isExpanded ? UserIconNameEnum.ChevronUp : UserIconNameEnum.ChevronDown;
    const toggleLabel = isExpanded ? t`Hide transactions` : t`Show transactions`;
    const accessibilityState = { expanded: isExpanded };

    return (
        <View className="flex-row items-start gap-x-xl">
            {isDefined(icon) ? <CircleIcon icon={icon} variant="ghost" size={32} iconSize={16} border={false} /> : null}

            <HapticPressable
                onPress={handleTogglePress}
                className="flex-1 gap-y-xxs"
                accessibilityRole="button"
                accessibilityState={accessibilityState}
                accessibilityLabel={toggleLabel}
                {...testID(CategorizeInboxClusterRowsSelector.Toggle, cluster.key)}
            >
                <Text className="text-primary text-sm font-semibold" numberOfLines={1}>
                    {cluster.displayTitle}
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
