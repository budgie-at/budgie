import { BudgetPeriodEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BUDGET_PERIOD_TITLE_LABEL } from '../../constant/budget-period-title-label.constant';
import { useFormatBudgetPeriod } from '../../hooks/use-format-budget-period.hook';
import { useGetActiveBudgetQuery } from '../../query/use-get-active-budget.query';
import { useGetBudgetPeriodSnapshotQuery } from '../../query/use-get-budget-period-snapshot.query';
import { BudgetPeriodSummaryCategoryRow } from '../budget-period-summary-category-row/budget-period-summary-category-row';
import { BudgetPeriodSummaryLimitRow } from '../budget-period-summary-limit-row/budget-period-summary-limit-row';
import { BudgetPeriodSummaryTotal } from '../budget-period-summary-total/budget-period-summary-total';

interface Props {
    readonly snapshotId: number;
}

export const BudgetPeriodSummary = ({ snapshotId }: Props) => {
    const { snapshot } = useGetBudgetPeriodSnapshotQuery(snapshotId);
    const { budget } = useGetActiveBudgetQuery();
    const { instrument } = useGetInstrumentByIdQuery(isDefined(budget) ? budget.instrumentId : 0);
    const { formatMonthAndDay } = useFormatDate();
    const { formatFullPeriod } = useFormatBudgetPeriod();
    const { t } = useLingui();

    if (!isDefined(snapshot)) {
        return null;
    }

    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const period = isDefined(budget) ? budget.period : BudgetPeriodEnum.MONTHLY;
    const dateRange = `${formatMonthAndDay(snapshot.periodStart)} – ${formatMonthAndDay(snapshot.periodEnd)}`;
    const totalLimit = snapshot.categories.reduce(
        (total, category) => total + category.carriedIn,
        snapshot.otherCarriedIn + snapshot.overallLimit
    );
    const estimateNote = snapshot.isReconstructed ? (
        <Text className="text-xs text-secondary-foreground">{t`Estimated from your past transactions using your current limits.`}</Text>
    ) : null;

    return (
        <>
            <FormsheetHeader size="md" title={formatFullPeriod(period, snapshot.periodStart, snapshot.periodEnd)} description={dateRange} />

            <ScrollView contentContainerClassName="px-5xl pt-md gap-y-7xl pb-3xl" showsVerticalScrollIndicator={false}>
                <BudgetPeriodSummaryTotal
                    title={t(BUDGET_PERIOD_TITLE_LABEL[period])}
                    spent={snapshot.overallSpent}
                    limit={totalLimit}
                    currencySymbol={currencySymbol}
                    footnote={estimateNote}
                />

                <View className="gap-y-xl">
                    <Text className="text-md font-semibold text-primary" accessibilityRole="header">
                        {t`Categories`}
                    </Text>

                    {snapshot.categories.map(category => (
                        <BudgetPeriodSummaryCategoryRow
                            key={category.id}
                            categoryId={category.categoryId}
                            limitAmount={category.limitAmount}
                            carriedAmount={category.carriedIn}
                            spent={category.spent}
                            currencySymbol={currencySymbol}
                        />
                    ))}

                    <BudgetPeriodSummaryLimitRow
                        title={t`Other`}
                        carriedAmount={snapshot.otherCarriedIn}
                        spent={snapshot.otherSpent}
                        baseLimit={snapshot.otherLimit}
                        currencySymbol={currencySymbol}
                        testID={BudgetSelector.PeriodSummaryOther}
                        spentTestID={BudgetSelector.PeriodSummaryOtherSpentLabel}
                    />
                </View>
            </ScrollView>
        </>
    );
};
