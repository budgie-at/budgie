import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { HeroFigure } from '../../../@generic/component/hero-figure/hero-figure';
import { SectionHeader } from '../../../@generic/component/section-header/section-header';
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
    const spentAmount = `−${formatAmount(overall.spent)}`;
    const upcomingAmount = `−${formatAmount(overall.upcoming)}`;

    return (
        <View className="gap-y-md">
            <SectionHeader label={t`Breakdown`} />
            <BudgetBreakdownRow label={t`Limit`} amount={formatAmount(overall.limit)} />
            <BudgetBreakdownRow label={t`Spent so far`} amount={spentAmount} />
            <BudgetBreakdownRow label={t`Upcoming this period`} amount={upcomingAmount} />
            <View className="h-hairline bg-secondary-corner" />
            <BudgetBreakdownRow label={t`Free to spend`} amount={freeAmount} className="font-semibold text-primary" />
            <Text className="text-xs tabular-nums text-secondary-foreground">{t`${freeAmount} ÷ ${daysLabel}`}</Text>
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
