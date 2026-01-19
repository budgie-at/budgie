import { Trans } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetCategoryStatusInterface } from '../../interface/budget-category-status.interface';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly categoryStatus: BudgetCategoryStatusInterface;
}

export const BudgetCategoryRow = ({ categoryStatus }: Props) => {
    const router = useRouter();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);

    const { category, limit, spent, remaining, percentage, status } = categoryStatus;
    const formattedSpent = formatMoney(spent, defaultInstrument.symbol);
    const formattedLimit = formatMoney(limit, defaultInstrument.symbol);
    const formattedRemaining = formatMoney(Math.abs(remaining), defaultInstrument.symbol);
    const isOverBudget = remaining < 0;

    const handlePress = () => void router.push(`/budget/category/${category.id}`);

    return (
        <HapticPressable onPress={handlePress} className="gap-y-sm">
            <View className="flex-row justify-between items-center">
                <Text className="text-primary font-medium">{category.title}</Text>
                <Text className="text-secondary-foreground">
                    {formattedSpent} / {formattedLimit}
                </Text>
            </View>
            <BudgetProgressBar percentage={percentage} status={status} size="sm" />
            <View className="flex-row justify-between items-center">
                <Text className="text-secondary-foreground text-sm">{percentage.toFixed(2)}%</Text>
                {isOverBudget ? (
                    <Text className="text-destructive-foreground text-sm">
                        {formattedRemaining} <Trans>over</Trans>
                    </Text>
                ) : (
                    <Text className="text-secondary-foreground text-sm">
                        {formattedRemaining} <Trans>left</Trans>
                    </Text>
                )}
            </View>
        </HapticPressable>
    );
};
