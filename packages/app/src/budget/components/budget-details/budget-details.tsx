import { router } from 'expo-router';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { BudgetSelector } from '../../budget.selector';
import { BudgetHighlightContext } from '../../context/budget-highlight.context';
import { useBudgetDetailsData } from '../../hooks/use-budget-details-data.hook';
import { useBudgetDetailsReveal } from '../../hooks/use-budget-details-reveal.hook';
import { findRiskiestAheadScope } from '../../utils/find-riskiest-ahead-scope.util';
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
    const { projection, isLoading, periodStart, periodEnd, currencySymbol, dateLabel } = useBudgetDetailsData(budget);
    const riskiestAheadScope = findRiskiestAheadScope(projection);
    const { scrollRef, contentRef, setHighlightTarget, highlightContextValue } = useBudgetDetailsReveal(
        isLoading,
        isDefined(riskiestAheadScope) ? riskiestAheadScope.target : null
    );
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
                        periodStart={periodStart}
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
                        currentPeriodStart={periodStart}
                        currentPeriodEnd={periodEnd}
                        currencySymbol={currencySymbol}
                    />
                </View>
            </BudgetHighlightContext>
        </CollapsibleChromePage>
    );
};
