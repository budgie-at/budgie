import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { BudgetSelector } from '../../budget.selector';
import { BudgetBreakdownRow } from '../budget-breakdown-row/budget-breakdown-row';

import type { BudgetProjectionInterface } from '@budgie/budget';

interface Props {
    readonly projection: BudgetProjectionInterface;
    readonly currencySymbol: string;
}

export const BudgetSafeToSpendSummary = ({ projection, currencySymbol }: Props) => {
    const { t } = useLingui();
    const formatProtectedAmount = useProtectedAmountLabel();
    const { overall, daysLeft } = projection;
    const formatAmount = (amount: number) => formatProtectedAmount(convertFromMicroUnits(amount), currencySymbol);
    const freeAmount = formatAmount(Math.max(overall.free, 0));
    const daysLabel = t({ message: plural(daysLeft, { one: '# day', other: '# days' }) });
    const spentRow = isPositiveNumber(overall.spent) ? (
        <BudgetBreakdownRow label={t`Spent so far`} amount={`−${formatAmount(overall.spent)}`} />
    ) : null;
    const upcomingRow = isPositiveNumber(overall.upcoming) ? (
        <BudgetBreakdownRow label={t`Upcoming this period`} amount={`−${formatAmount(overall.upcoming)}`} />
    ) : null;

    return (
        <View className="gap-y-md">
            <BudgetBreakdownRow label={t`Limit`} amount={formatAmount(overall.limit)} />
            {spentRow}
            {upcomingRow}
            <View className="h-hairline bg-secondary-corner" />
            <Text className="text-sm tabular-nums text-secondary-foreground">{t`${freeAmount} ÷ ${daysLabel}`}</Text>
            <HeroFigure
                amount={convertFromMicroUnits(overall.safePerDay)}
                currencySymbol={currencySymbol}
                variant="primary"
                unit={t`/ day`}
                testID={BudgetSelector.SafeToSpendPerDay}
            />
        </View>
    );
};
