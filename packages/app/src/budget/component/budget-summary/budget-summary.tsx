 
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly totalPlanned: number;
    readonly totalActual: number;
    readonly daysElapsed: number;
    readonly totalDays: number;
    readonly currencySymbol: string;
    readonly formatAmount: (value: number, symbol: string) => string;
}

export const BudgetSummary = ({ totalPlanned, totalActual, daysElapsed, totalDays, currencySymbol, formatAmount }: Props) => {
    const { t } = useLingui();
    const remaining = totalPlanned - totalActual;
    const isPositive = remaining >= 0;
    const remainingClassName = cn('text-2xl font-bold', isPositive ? 'text-positive-foreground' : 'text-warning-foreground');
    const spentAmount = formatAmount(convertFromMicroUnits(totalActual), currencySymbol);

    return (
        <View className="gap-4">
            <View className="flex-row justify-between">
                <View>
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Total Budget</Trans>
                    </Text>
                    <Text className="text-2xl font-bold text-primary">{formatAmount(convertFromMicroUnits(totalPlanned), currencySymbol)}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-xs text-secondary-foreground">
                        <Trans>Remaining</Trans>
                    </Text>
                    <Text className={remainingClassName}>{formatAmount(convertFromMicroUnits(remaining), currencySymbol)}</Text>
                </View>
            </View>

            <BudgetProgressBar planned={totalPlanned} actual={totalActual} className="h-3" />

            <View className="flex-row justify-between">
                <Text className="text-sm text-secondary-foreground">{t`Spent: ${spentAmount}`}</Text>
                <Text className="text-sm text-secondary-foreground">{t`${daysElapsed} of ${totalDays} days`}</Text>
            </View>
        </View>
    );
};
