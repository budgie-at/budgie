import { Trans } from '@lingui/react/macro';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { BudgetStatusEnum } from '../../enum/budget-status.enum';
import { BudgetCalculationResultInterface } from '../../interface/budget-calculation-result.interface';
import { BudgetAlertBadge } from '../budget-alert-badge/budget-alert-badge';
import { BudgetProgressBar } from '../budget-progress-bar/budget-progress-bar';

interface Props {
    readonly calculation: BudgetCalculationResultInterface | null;
    readonly isLoading: boolean;
    readonly startDate?: Date;
    readonly endDate?: Date;
}

export const BudgetWidget = ({ calculation, isLoading, startDate, endDate }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();

    const { formatMonthAndDay } = useFormatDate();
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
    const limitText = formatMoney(calculation.effectiveLimit, defaultInstrument.symbol);
    const remainingText = formatMoney(Math.abs(calculation.overallRemaining), defaultInstrument.symbol);
    const isOverBudget = calculation.overallRemaining < 0;
    const hasRollover = calculation.rolloverAmount !== 0;
    const rolloverText = formatMoney(calculation.rolloverAmount, defaultInstrument.symbol);
    const rolloverColorClass = calculation.rolloverAmount > 0 ? 'text-positive-foreground' : 'text-destructive-foreground';

    return (
        <Link href="/budget" asChild>
            <Card>
                <View className="flex-row items-center justify-between mb-md">
                    <View>
                        <Text className="text-primary font-medium">
                            <Trans>Budget</Trans>
                        </Text>
                        {isDefined(startDate) && isDefined(endDate) ? (
                            <Text className="text-secondary-foreground text-sm">
                                {formatMonthAndDay(startDate)} - {formatMonthAndDay(endDate)}
                            </Text>
                        ) : null}
                    </View>
                    <BudgetAlertBadge count={calculation.warningCount} hasExceeded={calculation.overallStatus === BudgetStatusEnum.OVER} />
                </View>
                <BudgetProgressBar percentage={calculation.overallPercentage} status={calculation.overallStatus} />
                <View className="flex-row items-center justify-between mt-md">
                    <View className="flex-row items-center gap-sm">
                        <Text className="text-secondary-foreground text-sm">
                            <Trans>
                                Spent {spentText} of {limitText}
                            </Trans>
                        </Text>
                        {hasRollover ? (
                            <Text className={`text-sm ${rolloverColorClass}`}>
                                ({calculation.rolloverAmount > 0 ? '+' : ''}
                                {rolloverText})
                            </Text>
                        ) : null}
                    </View>
                    {isOverBudget ? (
                        <Text className="text-destructive-foreground text-sm">
                            <Trans>{remainingText} over</Trans>
                        </Text>
                    ) : (
                        <Text className="text-positive-foreground text-sm">
                            <Trans>{remainingText} left</Trans>
                        </Text>
                    )}
                </View>
            </Card>
        </Link>
    );
};
