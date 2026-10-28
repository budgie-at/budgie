import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { Card } from '../../../@generic/component/card/card';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
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
    const safePerDayAmount = formatAmount(overall.safePerDay);
    const perDayLabel = t`${safePerDayAmount} / day`;
    const spentAmount = `−${formatAmount(overall.spent)}`;
    const upcomingAmount = `−${formatAmount(overall.upcoming)}`;

    return (
        <Card className="gap-y-md">
            <BudgetBreakdownRow label={t`Limit`} amount={formatAmount(overall.limit)} />
            <BudgetBreakdownRow label={t`Spent so far`} amount={spentAmount} />
            <BudgetBreakdownRow label={t`Upcoming this period`} amount={upcomingAmount} />
            <View className="h-px bg-secondary-corner" />
            <BudgetBreakdownRow label={t`Free to spend`} amount={freeAmount} className="font-semibold text-primary" />
            <Text className="text-sm tabular-nums text-secondary-foreground">{t`${freeAmount} ÷ ${daysLabel}`}</Text>
            <ProtectedText testID={BudgetSelector.SafeToSpendPerDay} className="text-xl font-bold tabular-nums text-positive-foreground">
                {perDayLabel}
            </ProtectedText>
        </Card>
    );
};
