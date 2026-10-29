import { BudgetAlertScopeEnum, getInclusiveEnd } from '@budgie/budget';
import { t } from '@lingui/core/macro';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetHighlightContext } from '../../context/budget-highlight.context';
import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { resolveBudgetWindow } from '../../utils/resolve-budget-window.util';
import { BudgetDetailsEditButton } from '../budget-details-edit-button/budget-details-edit-button';
import { BudgetDetailsOverview } from '../budget-details-overview/budget-details-overview';
import { BudgetEventsSection } from '../budget-events-section/budget-events-section';
import { BudgetFundsSection } from '../budget-funds-section/budget-funds-section';
import { BudgetHistorySection } from '../budget-history-section/budget-history-section';
import { BudgetLimitChangesRow } from '../budget-limit-changes-row/budget-limit-changes-row';
import { BudgetPeriodRecap } from '../budget-period-recap/budget-period-recap';

import type { BudgetHighlightTargetInterface } from '../../interface/budget-highlight-target.interface';
import type { BudgetEntityInterface } from '@budgie/contracts';
import type { KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';

interface Props {
    readonly budget: BudgetEntityInterface;
}

const REVEAL_TOP_MARGIN = 16;
const decodeHighlightParams = Schema.decodeUnknownOption(
    Schema.Struct({ scope: Schema.Enum(BudgetAlertScopeEnum), categoryId: Schema.optionalKey(Schema.NumberFromString) })
);

// eslint-disable-next-line max-statements -- Details orchestration component with multiple hooks and handlers
export const BudgetDetails = ({ budget }: Props) => {
    const { projection, isLoading } = useGetBudgetProjectionQuery(budget);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const periodWindow = resolveBudgetWindow(budget, useToday());
    const periodEnd = getInclusiveEnd(periodWindow.nextPeriodStart);
    const currencySymbol = isDefined(instrument) ? instrument.symbol : '';
    const dateLabel = formatBudgetPeriodLabel(budget, useFormatDate().formatMonthAndDay);
    const reducedMotion = useReducedMotion();
    const searchParams = useLocalSearchParams();
    const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
    const contentRef = useRef<View>(null);
    const [highlightTarget, setHighlightTarget] = useState<BudgetHighlightTargetInterface | null>(() =>
        Option.getOrNull(decodeHighlightParams(searchParams))
    );

    const handleReveal = (view: View) => {
        if (!isDefined(contentRef.current)) {
            return;
        }

        view.measureLayout(
            contentRef.current,
            (_left, top) => {
                scrollRef.current?.scrollTo({ y: Math.max(top - REVEAL_TOP_MARGIN, 0), animated: !reducedMotion });
                setHighlightTarget(null);
            },
            emptyFn
        );
    };

    const handleEditPress = () => {
        router.push({ pathname: '/budget/edit', params: { id: String(budget.id) } });
    };

    const handleFigurePress = () => {
        router.push('/budget-safe-to-spend');
    };

    const scrollViewProps = { ref: scrollRef };
    const highlightContextValue = { target: isLoading ? null : highlightTarget, reveal: handleReveal };

    return (
        <CollapsibleChromePage
            title={t`Budget details`}
            subtitle={dateLabel}
            leading={<HeaderBackButton />}
            trailing={<BudgetDetailsEditButton onPress={handleEditPress} />}
            scrollViewProps={scrollViewProps}
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
