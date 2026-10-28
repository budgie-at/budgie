import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ScrollView, Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { useGetActiveBudgetQuery } from '../../query/use-get-active-budget.query';
import { useGetBudgetPeriodSnapshotQuery } from '../../query/use-get-budget-period-snapshot.query';
import { getBudgetPeriodLabelDate } from '../../utils/get-budget-period-label-date.util';
import { BudgetDetailsLimitCard } from '../budget-details-limit-card/budget-details-limit-card';
import { BudgetPeriodSummaryCategoryRow } from '../budget-period-summary-category-row/budget-period-summary-category-row';

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

    return (
        <>
            <FormsheetHeader size="md" title={title} description={dateRange} />

            <ScrollView contentContainerClassName="px-3xl pt-md gap-y-md pb-5xl" showsVerticalScrollIndicator={false}>
                {snapshot.isReconstructed ? (
                    <Text className="text-secondary-foreground text-sm">
                        {t`Estimated from your past transactions using your current limits.`}
                    </Text>
                ) : null}

                <BudgetDetailsLimitCard
                    title={t`Monthly budget`}
                    icon={null}
                    spent={snapshot.overallSpent}
                    limitAmount={snapshot.overallLimit}
                    currencySymbol={currencySymbol}
                    testID={BudgetSelector.PeriodSummaryOverall}
                    spentTestID={BudgetSelector.PeriodSummaryOverallSpentLabel}
                />

                {snapshot.categories.map(category => (
                    <BudgetPeriodSummaryCategoryRow
                        key={category.id}
                        categoryId={category.categoryId}
                        limitAmount={category.limitAmount}
                        spent={category.spent}
                        currencySymbol={currencySymbol}
                    />
                ))}

                <BudgetDetailsLimitCard
                    title={t`Other`}
                    icon={UserIconNameEnum.CircleEllipsis}
                    spent={snapshot.otherSpent}
                    limitAmount={snapshot.otherLimit}
                    currencySymbol={currencySymbol}
                    testID={BudgetSelector.PeriodSummaryOther}
                    spentTestID={BudgetSelector.PeriodSummaryOtherSpentLabel}
                />
            </ScrollView>
        </>
    );
};
