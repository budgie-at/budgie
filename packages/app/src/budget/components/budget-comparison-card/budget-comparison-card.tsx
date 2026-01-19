import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetPeriodComparisonInterface } from '../../interface/budget-period-comparison.interface';
import { BudgetTrendDataPointInterface } from '../../interface/budget-trend-data-point.interface';

interface Props {
    readonly currentPeriod: BudgetTrendDataPointInterface;
    readonly previousPeriod: BudgetTrendDataPointInterface;
    readonly comparison: BudgetPeriodComparisonInterface;
}

export const BudgetComparisonCard = ({ currentPeriod, previousPeriod, comparison }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);
    const { symbol } = defaultInstrument;

    const spentDeltaIsPositive = comparison.spentDelta >= 0;
    const percentageDeltaIsPositive = comparison.percentageDelta >= 0;

    const spentDeltaText = formatMoney(Math.abs(comparison.spentDelta), symbol);
    const spentDeltaPercentageText = `${Math.abs(comparison.spentDeltaPercentage).toFixed(1)}%`;

    return (
        <Card>
            <Text className="text-primary font-medium mb-md">
                <Trans>Period Comparison</Trans>
            </Text>
            <View className="flex-row justify-between mb-md">
                <View className="flex-1">
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>Current</Trans>
                    </Text>
                    <Text className="text-primary font-medium">{currentPeriod.periodLabel}</Text>
                </View>
                <View className="flex-1 items-end">
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>Previous</Trans>
                    </Text>
                    <Text className="text-primary font-medium">{previousPeriod.periodLabel}</Text>
                </View>
            </View>
            <View className="bg-secondary-background rounded-xl p-md">
                <View className="flex-row justify-between items-center mb-sm">
                    <Text className="text-secondary-foreground">
                        <Trans>Spent</Trans>
                    </Text>
                    <View className="flex-row items-center gap-x-sm">
                        <Text className="text-primary">
                            {formatMoney(currentPeriod.spent, symbol)} <Trans>vs</Trans> {formatMoney(previousPeriod.spent, symbol)}
                        </Text>
                    </View>
                </View>
                <View className="flex-row justify-between items-center mb-sm">
                    <Text className="text-secondary-foreground">
                        <Trans>Difference</Trans>
                    </Text>
                    {spentDeltaIsPositive ? (
                        <Text className="text-destructive-foreground">
                            +{spentDeltaText} ({spentDeltaPercentageText})
                        </Text>
                    ) : (
                        <Text className="text-positive-foreground">
                            -{spentDeltaText} ({spentDeltaPercentageText})
                        </Text>
                    )}
                </View>
                <View className="flex-row justify-between items-center">
                    <Text className="text-secondary-foreground">
                        <Trans>Budget Usage</Trans>
                    </Text>
                    <View className="flex-row items-center gap-x-sm">
                        <Text className="text-primary">
                            {currentPeriod.percentage.toFixed(1)}% <Trans>vs</Trans> {previousPeriod.percentage.toFixed(1)}%
                        </Text>
                        {percentageDeltaIsPositive ? (
                            <Text className="text-destructive-foreground text-sm">(+{comparison.percentageDelta.toFixed(1)}%)</Text>
                        ) : (
                            <Text className="text-positive-foreground text-sm">({comparison.percentageDelta.toFixed(1)}%)</Text>
                        )}
                    </View>
                </View>
            </View>
        </Card>
    );
};
