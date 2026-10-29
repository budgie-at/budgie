import { BudgetAlertScopeEnum, computePeriodWindow, getInclusiveEnd } from '@budgie/budget';
import { t } from '@lingui/core/macro';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetHighlightContext } from '../../context/budget-highlight.context';
import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { BudgetDayStrip } from '../budget-day-strip/budget-day-strip';
import { BudgetDetailsCategoryList } from '../budget-details-category-list/budget-details-category-list';
import { BudgetDetailsEditButton } from '../budget-details-edit-button/budget-details-edit-button';
import { BudgetDetailsForecast } from '../budget-details-forecast/budget-details-forecast';
import { BudgetHistorySection } from '../budget-history-section/budget-history-section';
import { BudgetPeriodRecap } from '../budget-period-recap/budget-period-recap';
import { BudgetStatRow } from '../budget-stat-row/budget-stat-row';
import { BudgetVerdict } from '../budget-verdict/budget-verdict';

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

export const BudgetDetails = ({ budget }: Props) => {
    const { projection, isLoading } = useGetBudgetProjectionQuery(budget);
    const { instrument } = useGetInstrumentByIdQuery(budget.instrumentId);
    const periodWindow = computePeriodWindow(budget, useToday());
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

    const scrollViewProps = { ref: scrollRef };
    const highlightContextValue = { target: isLoading ? null : highlightTarget, reveal: handleReveal };

    return (
        <CollapsibleChromePage
            title={t`Budget details`}
            subtitle={dateLabel}
            leading={<HeaderBackButton />}
            trailing={<BudgetDetailsEditButton budgetId={budget.id} />}
            scrollViewProps={scrollViewProps}
        >
            <BudgetHighlightContext value={highlightContextValue}>
                <View ref={contentRef} collapsable={false} className="gap-y-3xl">
                    <BudgetPeriodRecap budgetId={budget.id} period={budget.period} currencySymbol={currencySymbol} />

                    <LoadingContent isLoading={isLoading}>
                        <BudgetVerdict projection={projection} currencySymbol={currencySymbol} onPaceHintPress={setHighlightTarget} />
                    </LoadingContent>

                    <LoadingContent isLoading={isLoading}>
                        <BudgetDayStrip projection={projection} period={budget.period} currencySymbol={currencySymbol} />
                    </LoadingContent>

                    <LoadingContent isLoading={isLoading}>
                        <BudgetStatRow scope={projection.overall} limitSource={budget.limitSource} currencySymbol={currencySymbol} />
                    </LoadingContent>

                    <BudgetDetailsForecast projection={projection} currencySymbol={currencySymbol} isLoading={isLoading} />

                    <LoadingContent isLoading={isLoading}>
                        <BudgetDetailsCategoryList
                            budget={budget}
                            projection={projection}
                            periodStart={periodWindow.periodStart}
                            periodEnd={periodEnd}
                            currencySymbol={currencySymbol}
                        />
                    </LoadingContent>

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
