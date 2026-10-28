import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { Card } from '../../../@generic/component/card/card';
import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { useGetActiveBudgetQuery } from '../../query/use-get-active-budget.query';
import { useGetBudgetPeriodSnapshotQuery } from '../../query/use-get-budget-period-snapshot.query';
import { getBudgetPeriodLabelDate } from '../../utils/get-budget-period-label-date.util';
import { BudgetPeriodSummaryCategoryRow } from '../budget-period-summary-category-row/budget-period-summary-category-row';
import { BudgetPeriodSummaryLimitRow } from '../budget-period-summary-limit-row/budget-period-summary-limit-row';

interface Props {
    readonly snapshotId: number;
}

export const BudgetPeriodSummary = ({ snapshotId }: Props) => {
    const { snapshot } = useGetBudgetPeriodSnapshotQuery(snapshotId);
    const { budget } = useGetActiveBudgetQuery();
    const { instrument } = useGetInstrumentByIdQuery(isDefined(budget) ? budget.instrumentId : 0);
    const { formatFullMonth, formatMonthAndDay } = useFormatDate();
    const { t } = useLingui();

    if (!isDefined(snapshot)) {
        return null;
    }

    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const title = formatFullMonth(getBudgetPeriodLabelDate(snapshot.periodStart, snapshot.periodEnd));
    const startLabel = formatMonthAndDay(snapshot.periodStart);
    const endLabel = formatMonthAndDay(snapshot.periodEnd);
    const dateRange = t`${startLabel} - ${endLabel}`;
    const totalCarriedIn = snapshot.categories.reduce((total, category) => total + category.carriedIn, snapshot.otherCarriedIn);

    return (
        <>
            <FormsheetHeader size="md" title={title} description={dateRange} />

            <ScrollView contentContainerClassName="px-3xl pt-md gap-y-md pb-5xl" showsVerticalScrollIndicator={false}>
                {snapshot.isReconstructed ? (
                    <Text className="text-secondary-foreground text-sm">
                        {t`Estimated from your past transactions using your current limits.`}
                    </Text>
                ) : null}

                <Card className="gap-y-xl">
                    <BudgetPeriodSummaryLimitRow
                        title={t`Monthly budget`}
                        carriedAmount={totalCarriedIn}
                        spent={snapshot.overallSpent}
                        limit={snapshot.overallLimit + totalCarriedIn}
                        currencySymbol={currencySymbol}
                        testID={BudgetSelector.PeriodSummaryOverall}
                        spentTestID={BudgetSelector.PeriodSummaryOverallSpentLabel}
                    />

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
                        limit={snapshot.otherLimit + snapshot.otherCarriedIn}
                        currencySymbol={currencySymbol}
                        testID={BudgetSelector.PeriodSummaryOther}
                        spentTestID={BudgetSelector.PeriodSummaryOtherSpentLabel}
                    />
                </Card>
            </ScrollView>
        </>
    );
};
