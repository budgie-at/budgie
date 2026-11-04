import { TransactionTypeEnum, UserIconNameEnum, convertFromMicroUnits } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { GroupedListIcon } from '../../../@generic/component/grouped-list-icon/grouped-list-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { AnalyticsTransactionsModeEnum } from '../../../transaction/enum/analytics-transactions-mode.enum';
import { BudgetRowChevron } from '../budget-row-chevron/budget-row-chevron';

import type { BudgetProjectionScopeInterface } from '@budgie/budget';

interface Props {
    readonly categoryIds: readonly number[];
    readonly scope: Pick<BudgetProjectionScopeInterface, 'limit' | 'spent'>;
    readonly tagId: number | null;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly currencySymbol: string;
}

export const BudgetEventOtherSpendingRow = ({ categoryIds, scope, tagId, periodStart, periodEnd, currencySymbol }: Props) => {
    const formatDigits = useFormatDigits(0);
    const spentLabel = formatDigits(convertFromMicroUnits(scope.spent), currencySymbol);

    const handlePress = () => {
        router.push({
            pathname: '/analytics/transactions',
            params: {
                mode: AnalyticsTransactionsModeEnum.BUDGET_OTHER,
                type: TransactionTypeEnum.EXPENSE,
                excludedCategoryIds: categoryIds.join(','),
                ...(isPositiveNumber(tagId) && { tagId: String(tagId) }),
                startDate: periodStart.toISOString(),
                endDate: periodEnd.toISOString()
            }
        });
    };

    if (isPositiveNumber(scope.limit) || !isPositiveNumber(scope.spent)) {
        return null;
    }

    return (
        <HapticPressable
            accessibilityRole="button"
            className="min-h-[44px] flex-row items-center gap-x-xl py-xs active:opacity-70"
            onPress={handlePress}
        >
            <GroupedListIcon icon={UserIconNameEnum.CircleEllipsis} />
            <Text className="text-primary flex-1 text-sm font-medium" numberOfLines={1}>
                <Trans>Other</Trans>
            </Text>
            <View className="flex-row items-center gap-x-xs">
                <ProtectedText className="text-sm font-semibold tabular-nums text-primary">{spentLabel}</ProtectedText>
                <BudgetRowChevron />
            </View>
        </HapticPressable>
    );
};
