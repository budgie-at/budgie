import { getInclusiveEnd } from '@budgie/budget';
import { router } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetHighlightContext } from '../../context/budget-highlight.context';
import { useBudgetDetailsReveal } from '../../hooks/use-budget-details-reveal.hook';
import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { findRiskiestAheadScope } from '../../utils/find-riskiest-ahead-scope.util';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { resolveBudgetWindow } from '../../utils/resolve-budget-window.util';
import { BudgetDetailsEditButton } from '../budget-details-edit-button/budget-details-edit-button';
import { BudgetDetailsOverview } from '../budget-details-overview/budget-details-overview';
import { BudgetEventsSection } from '../budget-events-section/budget-events-section';
import { BudgetFundsSection } from '../budget-funds-section/budget-funds-section';
import { BudgetHistorySection } from '../budget-history-section/budget-history-section';
import { BudgetLimitChangesRow } from '../budget-limit-changes-row/budget-limit-changes-row';
import { BudgetPeriodRecap } from '../budget-period-recap/budget-period-recap';

import type { BudgetEntityInterface } from '@budgie/contracts';

interface Props {
    readonly budget: BudgetEntityInterface;
}

export const BudgetDetails = ({ budget }: Props) => {
    const today = useToday();
    const { formatMonthAndDay } = useFormatDate();
    const { projection, isLoading } = useGetBudgetProjectionQuery(budget);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const riskiestAheadScope = findRiskiestAheadScope(projection);
    const { scrollRef, contentRef, setHighlightTarget, highlightContextValue } = useBudgetDetailsReveal(
        isLoading,
        isDefined(riskiestAheadScope) ? riskiestAheadScope.target : null
    );
    const periodWindow = resolveBudgetWindow(budget, today);
    const periodEnd = getInclusiveEnd(periodWindow.nextPeriodStart);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const dateLabel = formatBudgetPeriodLabel(budget, formatMonthAndDay);
    const scrollViewProps = { ref: scrollRef };

    const handleEditPress = () => {
        router.push({ pathname: '/budget/edit', params: { id: String(budget.id) } });
    };

    const handleFigurePress = () => {
        router.push('/budget-safe-to-spend');
    };

    return (
        <CollapsibleChromePage
            title={budget.name}
            subtitle={dateLabel}
            leading={<HeaderBackButton />}
            trailing={<BudgetDetailsEditButton onPress={handleEditPress} />}
            scrollViewProps={scrollViewProps}
            testID={BudgetSelector.DetailsScreen}
        >
            <BudgetHighlightContext value={highlightContextValue}>
                <View ref={contentRef} collapsable={false} className="gap-y-3xl">
                    <BudgetPeriodRecap budgetId={budget.id} period={budget.period} currencySymbol={currencySymbol} />

                    <BudgetDetailsOverview
                        budget={budget}
                        projection={projection}
                        isLoading={isLoading}
                        currencySymbol={currencySymbol}
                        periodStart={periodWindow.periodStart}
                        periodEnd={periodEnd}
                        onFigurePress={handleFigurePress}
                        onPaceHintPress={setHighlightTarget}
                    />

                    <BudgetFundsSection budget={budget} currencySymbol={currencySymbol} />

                    <BudgetEventsSection />

                    <BudgetLimitChangesRow budget={budget} currencySymbol={currencySymbol} />

                    <BudgetHistorySection
                        budgetId={budget.id}
                        period={budget.period}
                        overallLimit={projection.overall.limit}
                        currentSpent={projection.overall.spent}
                        currentPeriodStart={periodWindow.periodStart}
                        currentPeriodEnd={periodEnd}
                        currencySymbol={currencySymbol}
                    />
                </View>
            </BudgetHighlightContext>
        </CollapsibleChromePage>
    );
};
