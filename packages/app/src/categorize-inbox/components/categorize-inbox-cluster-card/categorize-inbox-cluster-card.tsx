import { CategorizeInboxSectionEnum } from '@budgie/categorization';
import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { testID } from '../../../@generic/utils/test-id.util';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useCategorizeInboxContext } from '../../context/categorize-inbox.context';
import { CategorizeInboxCashWithdrawalChips } from '../categorize-inbox-cash-withdrawal-chips/categorize-inbox-cash-withdrawal-chips';
import { CategorizeInboxClusterRow } from '../categorize-inbox-cluster-row/categorize-inbox-cluster-row';
import { CategorizeInboxSuggestionChips } from '../categorize-inbox-suggestion-chips/categorize-inbox-suggestion-chips';

import { CategorizeInboxClusterCardSelector } from './categorize-inbox-cluster-card.selector';

import type { CategorizeInboxClusterInterface } from '@budgie/categorization';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
}

export const CategorizeInboxClusterCard = ({ cluster }: Props) => {
    const { t } = useLingui();
    const protectAmount = useProtectedAmountLabel();
    const { defaultInstrument } = useSettingsContext();
    const { expandedClusterKey, excludedTransactionIds, toggleExpanded } = useCategorizeInboxContext();

    const handleTogglePress = (): void => void toggleExpanded(cluster.key);

    const { displayTitle, rows } = cluster;
    const isExpanded = expandedClusterKey === cluster.key;
    const countText = t({ message: plural(rows.length, { one: '# transaction', other: '# transactions' }) });
    const skippedCount = rows.filter(row => excludedTransactionIds.has(row.transactionId)).length;
    const skippedText = isPositiveNumber(skippedCount)
        ? ` · ${t({ message: plural(skippedCount, { one: '# skipped', other: '# skipped' }) })}`
        : null;
    const amountText = isDefined(cluster.totalBaseAmount)
        ? protectAmount(convertFromMicroUnits(cluster.totalBaseAmount), defaultInstrument.symbol)
        : null;
    const chevronIcon = isExpanded ? UserIconNameEnum.ChevronUp : UserIconNameEnum.ChevronDown;
    const toggleLabel = isExpanded ? t`Hide transactions for ${displayTitle}` : t`Show transactions for ${displayTitle}`;
    const accessibilityState = { expanded: isExpanded };

    return (
        <Card size="sm" className="gap-y-lg" {...testID(CategorizeInboxClusterCardSelector.Card, cluster.key)}>
            <View className="flex-row items-start gap-x-xl">
                <HapticPressable
                    onPress={handleTogglePress}
                    className="flex-1 gap-y-xxs"
                    accessibilityRole="button"
                    accessibilityState={accessibilityState}
                    accessibilityLabel={toggleLabel}
                    {...testID(CategorizeInboxClusterCardSelector.Toggle, cluster.key)}
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

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="flex-row items-center gap-x-sm">
                {cluster.section === CategorizeInboxSectionEnum.CASH_WITHDRAWALS ? (
                    <CategorizeInboxCashWithdrawalChips cluster={cluster} />
                ) : null}
                <CategorizeInboxSuggestionChips cluster={cluster} />
            </ScrollView>

            {isExpanded ? (
                <View className="border-t border-secondary-corner gap-y-lg pt-lg">
                    {rows.map(row => (
                        <CategorizeInboxClusterRow key={row.transactionId} row={row} displayTitle={displayTitle} />
                    ))}
                </View>
            ) : null}
        </Card>
    );
};
