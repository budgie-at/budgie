import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

const spentTextVariants = cva('text-sm font-medium', {
    variants: { status: { overBudget: 'text-warning-foreground', normal: 'text-primary' } }
});

const remainingTextVariants = cva('text-xs', {
    variants: { status: { overBudget: 'text-warning-foreground', normal: 'text-positive-foreground' } }
});

const percentageTextVariants = cva('text-xs', {
    variants: { status: { overBudget: 'text-warning-foreground', normal: 'text-secondary-foreground' } }
});

interface Props {
    readonly budgetId: number;
    readonly allocationId: number;
    readonly name: string;
    readonly icon: UserIconNameEnum;
    readonly spent: number;
    readonly planned: number;
    readonly remaining: number;
    readonly percentage: number;
    readonly isOverBudget: boolean;
    readonly currencySymbol: string;
}

export const BudgetCategoryItem = (props: Props) => {
    const { budgetId, allocationId, name, icon, spent, planned, remaining, percentage, isOverBudget, currencySymbol } = props;
    const formatDigits = useFormatDigits(0);

    const status = isOverBudget ? 'overBudget' : 'normal';
    const catSpentFormatted = formatDigits(convertFromMicroUnits(spent), currencySymbol);
    const catPlannedFormatted = formatDigits(convertFromMicroUnits(planned), currencySymbol);
    const catRemainingFormatted = formatDigits(convertFromMicroUnits(Math.abs(remaining)), currencySymbol);

    const handlePress = () => void router.push(`/budget/${budgetId}/allocation/${allocationId}`);

    return (
        <HapticPressable onPress={handlePress}>
            <Card className="gap-2" size="sm">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2 flex-1">
                        <Icon icon={icon} size={16} className="text-secondary-foreground" />
                        <Text className="text-sm font-medium text-primary flex-1" numberOfLines={1}>
                            {name}
                        </Text>
                    </View>

                    <Text className={spentTextVariants({ status })}>
                        {catSpentFormatted}
                        <Text className="text-xs text-secondary-foreground">{` / ${catPlannedFormatted}`}</Text>
                    </Text>
                </View>

                <BudgetProgressBar planned={planned} actual={spent} className="h-1.5" />

                <View className="flex-row justify-between">
                    <Text className={remainingTextVariants({ status })}>
                        {isOverBudget ? <Trans>Over by {catRemainingFormatted}</Trans> : <Trans>{catRemainingFormatted} left</Trans>}
                    </Text>
                    <Text className={percentageTextVariants({ status })}>{percentage}%</Text>
                </View>
            </Card>
        </HapticPressable>
    );
};
