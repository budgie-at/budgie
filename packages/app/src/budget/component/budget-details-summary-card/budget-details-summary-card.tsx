import { Trans, useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { Icon } from '../../../@generic/component/icon/icon';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

const safeToSpendVariants = cva('text-3xl font-bold', {
    variants: { status: { positive: 'text-positive-foreground', negative: 'text-warning-foreground' } }
});

const remainingVariants = cva('text-lg font-semibold', {
    variants: { status: { positive: 'text-positive-foreground', negative: 'text-warning-foreground' } }
});

interface Props {
    readonly safeToSpend: number;
    readonly dailyBudget: number;
    readonly remaining: number;
    readonly totalPlanned: number;
    readonly totalSpent: number;
    readonly daysRemaining: number;
    readonly totalDays: number;
    readonly categoriesOverBudget: number;
    readonly currencySymbol: string;
}

export const BudgetDetailsSummaryCard = (props: Props) => {
    const { safeToSpend, dailyBudget, remaining, totalPlanned, totalSpent, daysRemaining, totalDays, categoriesOverBudget, currencySymbol } = props;
    const { t } = useLingui();
    const formatDigits = useFormatDigits(0);

    const isPositive = remaining >= 0;
    const status = isPositive ? 'positive' : 'negative';

    const safeToSpendFormatted = formatDigits(convertFromMicroUnits(safeToSpend), currencySymbol);
    const dailyBudgetFormatted = formatDigits(convertFromMicroUnits(dailyBudget), currencySymbol);
    const remainingFormatted = formatDigits(convertFromMicroUnits(remaining), currencySymbol);
    const totalPlannedFormatted = formatDigits(convertFromMicroUnits(totalPlanned), currencySymbol);
    const totalSpentFormatted = formatDigits(convertFromMicroUnits(totalSpent), currencySymbol);

    return (
        <Card className="gap-3" size="md">
            <View className="flex-row justify-between items-start">
                <View>
                    <Text className="text-xs text-secondary-foreground"><Trans>Safe to Spend</Trans></Text>
                    <Text className={safeToSpendVariants({ status })}>{safeToSpendFormatted}</Text>
                    <Text className="text-xs text-secondary-foreground">{t`${dailyBudgetFormatted}/day`}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-xs text-secondary-foreground"><Trans>Remaining</Trans></Text>
                    <Text className={remainingVariants({ status })}>{remainingFormatted}</Text>
                    <Text className="text-xs text-secondary-foreground">{t`of ${totalPlannedFormatted}`}</Text>
                </View>
            </View>
            <BudgetProgressBar planned={totalPlanned} actual={totalSpent} className="h-2" />
            <View className="flex-row justify-between">
                <Text className="text-xs text-secondary-foreground">{t`Spent: ${totalSpentFormatted}`}</Text>
                <Text className="text-xs text-secondary-foreground">{t`${daysRemaining} of ${totalDays} days left`}</Text>
            </View>
            {categoriesOverBudget > 0 && (
                <View className="flex-row items-center gap-1 pt-1">
                    <Icon icon="AlertTriangle" size={12} className="text-warning-foreground" />
                    <Text className="text-xs text-warning-foreground">{t`${categoriesOverBudget} categories over budget`}</Text>
                </View>
            )}
        </Card>
    );
};


