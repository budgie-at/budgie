import { getInclusiveEnd } from '@budgie/budget';
import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { SectionHeader } from '../../../@generic/component/section-header/section-header';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { resolveBudgetWindow } from '../../utils/resolve-budget-window.util';
import { BudgetSafeToSpendSummary } from '../budget-safe-to-spend-summary/budget-safe-to-spend-summary';
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
    const { formatMonthAndDay } = useFormatDate();
    const { upcomingCharges } = projection;

    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const periodEnd = getInclusiveEnd(resolveBudgetWindow(budget, today).nextPeriodStart);
    const periodEndLabel = formatMonthAndDay(periodEnd);

    const upcomingSection = isNotEmptyArray(upcomingCharges) ? (
        <View className="gap-y-lg">
            <SectionHeader label={t`Upcoming this period`} />
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
        <View
            className="border-t-hairline border-secondary-corner bg-primary-reverse dark:bg-secondary-background"
            collapsable={false}
            testID={BudgetSelector.SafeToSpendSheet}
        >
            <FormsheetHeader size="md" title={t`Safe to spend`} description={t`Until ${periodEndLabel}`} />

            <ScrollView contentContainerClassName="px-5xl pt-md gap-y-3xl pb-safe-or-[16px]" showsVerticalScrollIndicator={false}>
                <BudgetSafeToSpendSummary projection={projection} currencySymbol={currencySymbol} />

                {upcomingSection}

                <Text className="text-xxs text-secondary-foreground">
                    <Trans>Recalculates every day. Spend less today and tomorrow&apos;s amount grows.</Trans>
                </Text>
            </ScrollView>
        </View>
    );
};
