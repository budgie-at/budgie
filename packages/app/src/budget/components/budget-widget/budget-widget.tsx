import { Trans } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetCalculationResultInterface } from '../../interface/budget-calculation-result.interface';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly calculation: BudgetCalculationResultInterface | null;
    readonly isLoading: boolean;
}

export const BudgetWidget = ({ calculation, isLoading }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();

    const formatMoney = useFormatDigits(decimalPlaces);

    if (isLoading) {
        return (
            <Card>
                <Text className="text-secondary-foreground">
                    <Trans>Loading budget...</Trans>
                </Text>
            </Card>
        );
    }

    if (!isDefined(calculation)) {
        return (
            <Link href="/budget/setup" asChild>
                <Card>
                    <Text className="text-primary font-medium">
                        <Trans>Set up your budget</Trans>
                    </Text>
                    <Text className="text-secondary-foreground text-sm">
                        <Trans>Track your spending and stay on target</Trans>
                    </Text>
                </Card>
            </Link>
        );
    }

    const spentText = formatMoney(calculation.totalSpent, defaultInstrument.symbol);
    const limitText = formatMoney(calculation.budget.overallLimit, defaultInstrument.symbol);
    const overPaceAmount = formatMoney(Math.abs(calculation.paceVariance), defaultInstrument.symbol);

    return (
        <Link href="/budget" asChild>
            <Card>
                <View className="flex-row items-center justify-between mb-md">
                    <Text className="text-primary font-medium">
                        <Trans>Budget</Trans>
                    </Text>
                    {isPositiveNumber(calculation.warningCount) ? (
                        <View className="bg-warning-corner rounded-full px-sm py-xs">
                            <Text className="text-warning-foreground text-xs">{calculation.warningCount}</Text>
                        </View>
                    ) : null}
                </View>
                <BudgetProgressBar percentage={calculation.overallPercentage} status={calculation.overallStatus} />
                <View className="flex-row items-center justify-between mt-md">
                    <Text className="text-secondary-foreground text-sm">
                        {spentText} / {limitText}
                    </Text>
                    {calculation.isOnPace ? (
                        <Text className="text-positive-foreground text-sm">
                            <Trans>On track</Trans>
                        </Text>
                    ) : (
                        <Text className="text-destructive-foreground text-sm">
                            <Trans>{overPaceAmount} over pace</Trans>
                        </Text>
                    )}
                </View>
            </Card>
        </Link>
    );
};
