import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';
import { cva } from 'class-variance-authority';

interface Props {
    readonly totalPlanned: number;
    readonly totalActual: number;
    readonly daysElapsed: number;
    readonly totalDays: number;
    readonly currencySymbol: string;
    readonly formatAmount: (value: number, symbol: string) => string;
}

const remainingVariants = cva('text-2xl font-bold', {
    variants: {
        isPositive: {
            true: 'text-positive-foreground',
            false: 'text-warning-foreground'
        }
    }
});

export const BudgetSummary = ({ totalPlanned, totalActual, daysElapsed, totalDays, currencySymbol, formatAmount }: Props) => {
    const remaining = totalPlanned - totalActual;
    const isPositive = isPositiveNumber(remaining);
    const spentAmount = formatAmount(convertFromMicroUnits(totalActual), currencySymbol);

    return (
        <View className="gap-4">
            <View className="flex-row justify-between">
                <View>
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Total Budget</Trans>
                    </Text>

                    <Text className="text-2xl font-bold text-primary">
                        {formatAmount(convertFromMicroUnits(totalPlanned), currencySymbol)}
                    </Text>
                </View>
                <View className="items-end">
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Remaining</Trans>
                    </Text>

                    <Text className={remainingVariants({ isPositive })}>
                        {formatAmount(convertFromMicroUnits(remaining), currencySymbol)}
                    </Text>
                </View>
            </View>

            <BudgetProgressBar planned={totalPlanned} actual={totalActual} className="h-3" />

            <View className="flex-row justify-between">
                <Text className="text-sm text-secondary-foreground">
                    <Trans>Spent: {spentAmount}</Trans>
                </Text>
                <Text className="text-sm text-secondary-foreground">
                    <Trans>
                        {daysElapsed} of {totalDays} days
                    </Trans>
                </Text>
            </View>
        </View>
    );
};
