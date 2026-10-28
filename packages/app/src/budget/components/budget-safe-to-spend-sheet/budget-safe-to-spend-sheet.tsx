import { computePeriodWindow, getInclusiveEnd } from '@budgie/budget';
import { convertFromMicroUnits } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { BudgetBreakdownRow } from '../budget-breakdown-row/budget-breakdown-row';
import { BudgetUpcomingChargeRow } from '../budget-upcoming-charge-row/budget-upcoming-charge-row';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetSafeToSpendSheet = ({ budget }: Props) => {
    const { t } = useLingui();
    const today = useToday();
    const { projection } = useGetBudgetProjectionQuery(budget);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const formatProtectedAmount = useProtectedAmountLabel();
    const { formatMonthAndDay } = useFormatDate();
    const { overall, daysLeft, upcomingCharges } = projection;

    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const formatAmount = (amount: number) => formatProtectedAmount(convertFromMicroUnits(amount), currencySymbol);
    const periodEnd = getInclusiveEnd(computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, today).nextPeriodStart);
    const periodEndLabel = formatMonthAndDay(periodEnd);
    const freeAmount = formatAmount(Math.max(overall.free, 0));
    const daysLabel = t({ message: plural(daysLeft, { one: '# day', other: '# days' }) });
    const safePerDayAmount = formatAmount(overall.safePerDay);
    const perDayLabel = t`${safePerDayAmount} / day`;
    const spentAmount = `−${formatAmount(overall.spent)}`;
    const upcomingAmount = `−${formatAmount(overall.upcoming)}`;

    const upcomingSection = isNotEmptyArray(upcomingCharges) ? (
        <View className="gap-y-md">
            <Text className="text-lg font-semibold text-primary">
                <Trans>Upcoming this period</Trans>
            </Text>
            {upcomingCharges.map(charge => (
                <BudgetUpcomingChargeRow
                    key={`${charge.source.kind}-${charge.source.id}-${charge.date.getTime()}`}
                    charge={charge}
                    currencySymbol={currencySymbol}
                />
            ))}
        </View>
    ) : null;

    return (
        <View className="flex-1 bg-primary-reverse" collapsable={false} testID={BudgetSelector.SafeToSpendSheet}>
            <FormsheetHeader size="md" title={t`Safe to spend`} description={t`Until ${periodEndLabel}`} />

            <ScrollView contentContainerClassName="px-3xl pt-md gap-y-3xl pb-5xl" showsVerticalScrollIndicator={false}>
                <Card className="gap-y-md">
                    <BudgetBreakdownRow label={t`Limit`} amount={formatAmount(overall.limit)} />
                    <BudgetBreakdownRow label={t`Spent so far`} amount={spentAmount} />
                    <BudgetBreakdownRow label={t`Upcoming this period`} amount={upcomingAmount} />
                    <View className="h-px bg-secondary-corner" />
                    <BudgetBreakdownRow label={t`Free to spend`} amount={freeAmount} className="font-semibold text-primary" />
                    <Text className="text-sm tabular-nums text-secondary-foreground">{t`${freeAmount} ÷ ${daysLabel}`}</Text>
                    <ProtectedText
                        testID={BudgetSelector.SafeToSpendPerDay}
                        className="text-xl font-bold tabular-nums text-positive-foreground"
                    >
                        {perDayLabel}
                    </ProtectedText>
                </Card>

                {upcomingSection}

                <Text className="text-center text-sm text-secondary-foreground">
                    <Trans>Recalculates every day. Spend less today and tomorrow&apos;s amount grows.</Trans>
                </Text>
            </ScrollView>
        </View>
    );
};
