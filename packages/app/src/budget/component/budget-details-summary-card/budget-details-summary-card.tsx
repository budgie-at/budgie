import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetAmountDisplay } from '../budget-amount-display/budget-amount-display';
import { BudgetOverBudgetWarning } from '../budget-over-budget-warning/budget-over-budget-warning';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

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
    const {
        safeToSpend,
        dailyBudget,
        remaining,
        totalPlanned,
        totalSpent,
        daysRemaining,
        totalDays,
        categoriesOverBudget,
        currencySymbol
    } = props;
    const { t } = useLingui();
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const status = remaining >= 0 ? 'positive' : 'negative';

    const safeToSpendFormatted = formatDigits(convertFromMicroUnits(safeToSpend), currencySymbol);
    const dailyBudgetFormatted = formatDigits(convertFromMicroUnits(dailyBudget), currencySymbol);
    const remainingFormatted = formatDigits(convertFromMicroUnits(remaining), currencySymbol);
    const totalPlannedFormatted = formatDigits(convertFromMicroUnits(totalPlanned), currencySymbol);
    const totalSpentFormatted = formatDigits(convertFromMicroUnits(totalSpent), currencySymbol);

    return (
        <Card className="gap-3" size="md">
            <View className="flex-row justify-between items-start">
                <BudgetAmountDisplay
                    label={t`Safe to Spend`}
                    amount={safeToSpendFormatted}
                    status={status}
                    subtitle={t`${dailyBudgetFormatted}/day`}
                />
                <BudgetAmountDisplay
                    label={t`Remaining`}
                    amount={remainingFormatted}
                    status={status}
                    size="sm"
                    align="end"
                    subtitle={t`of ${totalPlannedFormatted}`}
                />
            </View>

            <BudgetProgressBar planned={totalPlanned} actual={totalSpent} className="h-2" />

            <View className="flex-row justify-between">
                <Text className="text-xs text-secondary-foreground">
                    <Trans>Spent: {totalSpentFormatted}</Trans>
                </Text>
                <Text className="text-xs text-secondary-foreground">
                    <Trans>
                        {daysRemaining} of {totalDays} days left
                    </Trans>
                </Text>
            </View>

            {isPositiveNumber(categoriesOverBudget) && <BudgetOverBudgetWarning count={categoriesOverBudget} />}
        </Card>
    );
};
