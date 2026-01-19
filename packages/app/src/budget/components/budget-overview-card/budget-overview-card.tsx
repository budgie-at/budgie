import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetCalculationResultInterface } from '../../interface/budget-calculation-result.interface';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly calculation: BudgetCalculationResultInterface;
}

export const BudgetOverviewCard = ({ calculation }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatMoney = useFormatDigits(decimalPlaces);
    const { symbol } = defaultInstrument;

    const hasRollover = calculation.rolloverAmount !== 0;
    const displayLimit = hasRollover ? calculation.effectiveLimit : calculation.overallLimit;
    const rolloverColorClass = calculation.rolloverAmount > 0 ? 'text-positive-foreground' : 'text-destructive-foreground';
    const rolloverPrefix = calculation.rolloverAmount > 0 ? '+' : '';

    return (
        <Card>
            <Text className="text-primary font-medium mb-md">
                <Trans>Overall Budget</Trans>
            </Text>
            <BudgetProgressBar percentage={calculation.overallPercentage} status={calculation.overallStatus} />
            <View className="flex-row justify-between mt-md">
                <Text className="text-secondary-foreground">
                    <Trans>Spent</Trans>
                </Text>
                <Text className="text-primary">
                    {formatMoney(calculation.totalSpent, symbol)} / {formatMoney(displayLimit, symbol)}
                </Text>
            </View>
            {hasRollover ? (
                <View className="flex-row justify-between mt-sm">
                    <Text className="text-secondary-foreground">
                        <Trans>Rollover</Trans>
                    </Text>
                    <Text className={rolloverColorClass}>
                        {rolloverPrefix}
                        {formatMoney(calculation.rolloverAmount, symbol)}
                    </Text>
                </View>
            ) : null}
            <View className="flex-row justify-between mt-sm">
                <Text className="text-secondary-foreground">
                    <Trans>Allocated</Trans>
                </Text>
                <Text className="text-primary">{formatMoney(calculation.allocatedAmount, symbol)}</Text>
            </View>
            <View className="flex-row justify-between mt-sm">
                <Text className="text-secondary-foreground">
                    <Trans>Buffer</Trans>
                </Text>
                <Text className="text-primary">{formatMoney(calculation.unallocatedBuffer, symbol)}</Text>
            </View>
        </Card>
    );
};
