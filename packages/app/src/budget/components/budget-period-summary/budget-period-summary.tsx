import { BudgetPeriodEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { FormsheetHeader } from '../../../@generic/component/formsheet-header/formsheet-header';
import { ScrollableSheetCard } from '../../../@generic/component/scrollable-sheet-card/scrollable-sheet-card';
import { MORPHING_SHEET_DESTINATION_HEIGHT_RATIO } from '../../../@generic/constant/morphing-sheet-height-ratio.constant';
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
import { BudgetSheetState } from '../budget-sheet-state/budget-sheet-state';

interface Props {
    readonly snapshotId: number;
}

export const BudgetPeriodSummary = ({ snapshotId }: Props) => {
    const { snapshot, isLoading, isError } = useGetBudgetPeriodSnapshotQuery(snapshotId);
    const { budget } = useGetActiveBudgetQuery();
    const { instrument } = useGetInstrumentByIdQuery(isDefined(budget) ? budget.instrumentId : 0);
    const { formatMonthAndDay } = useFormatDate();
    const { formatFullPeriod } = useFormatBudgetPeriod();
    const { t } = useLingui();

    const missingDescription = isError ? t`Your data could not be loaded. Close this screen and try again.` : '';

    if (!isDefined(snapshot)) {
        return (
            <BudgetSheetState
                title={t`Period summary`}
                unavailableTitle={t`Summary unavailable`}
                isLoading={isLoading}
                isError={isError}
                description={missingDescription}
            />
        );
    }

    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const period = isDefined(budget) ? budget.period : BudgetPeriodEnum.MONTHLY;
    const totalLimit = snapshot.categories.reduce(
        (total, category) => total + category.carriedIn,
        snapshot.otherCarriedIn + snapshot.overallLimit
    );
    const estimateNote = snapshot.isReconstructed ? (
        <Text className="text-xs text-secondary-foreground">{t`Estimated from your past transactions using your current limits.`}</Text>
    ) : null;

    return (
        <ScrollableSheetCard
            header={
                <FormsheetHeader
                    size="md"
                    title={formatFullPeriod(period, snapshot.periodStart, snapshot.periodEnd)}
                    description={`${formatMonthAndDay(snapshot.periodStart)} – ${formatMonthAndDay(snapshot.periodEnd)}`}
                />
            }
            ratio={MORPHING_SHEET_DESTINATION_HEIGHT_RATIO}
            contentClassName="px-5xl pt-md gap-y-7xl pb-3xl"
        >
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
                    icon={UserIconNameEnum.CircleEllipsis}
                />
            </View>
        </ScrollableSheetCard>
    );
};
