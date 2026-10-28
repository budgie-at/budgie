import { BudgetAlertScopeEnum, computePeriodWindow, getInclusiveEnd } from '@budgie/budget';
import { UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Trans } from '@lingui/react/macro';
import * as Option from 'effect/Option';
import * as Schema from 'effect/Schema';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { emptyFn, isDefined, isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { LoadingContent } from '../../../@generic/component/loading-content/loading-content';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useToday } from '../../../@generic/hook/use-today.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { BudgetSelector } from '../../budget.selector';
import { BudgetHighlightContext } from '../../context/budget-highlight.context';
import { useGetBudgetProjectionQuery } from '../../query/use-get-budget-projection.query';
import { formatBudgetPeriodLabel } from '../../utils/format-budget-period-label.util';
import { BudgetDetailsCategoryList } from '../budget-details-category-list/budget-details-category-list';
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
    const periodWindow = computePeriodWindow(budget.periodStartDay, budget.useLastDayOfMonth, useToday());
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
    const hasCategoryLimitsContent = isNotEmptyArray(projection.categories) || isPositiveNumber(budget.otherLimit);

    const handleEditPress = () => {
        router.push({ pathname: '/budget/edit', params: { id: String(budget.id) } });
    };

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

    const highlightContextValue = { target: isLoading ? null : highlightTarget, reveal: handleReveal };

    const categoryLimitsContent = hasCategoryLimitsContent ? (
        <BudgetDetailsCategoryList
            projection={projection}
            periodStart={periodWindow.periodStart}
            periodEnd={periodEnd}
            currencySymbol={currencySymbol}
        />
    ) : (
        <Text className="text-secondary-foreground text-sm">
            <Trans>No category limits yet</Trans>
        </Text>
    );

    const headerAction = (
        <HapticPressable
            accessible
            accessibilityLabel={t`Manage budget`}
            accessibilityRole="button"
            className="relative h-[40px] w-[40px]"
            collapsable={false}
            nativeID={BudgetSelector.DetailsEditButton}
            testID={BudgetSelector.DetailsEditButton}
            onPress={handleEditPress}
        >
            <View
                collapsable={false}
                nativeID={BudgetSelector.DetailsEditButton}
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                testID={BudgetSelector.DetailsEditButton}
            />
            <CircleIcon icon={UserIconNameEnum.EllipsisVertical} variant="ghost" size={40} iconSize={24} border={false} />
        </HapticPressable>
    );

    return (
        <CollapsibleChromePage
            title={t`Budget details`}
            subtitle={dateLabel}
            leading={<HeaderBackButton />}
            trailing={headerAction}
            scrollViewProps={{ ref: scrollRef }}
        >
            <BudgetHighlightContext value={highlightContextValue}>
                <View ref={contentRef} collapsable={false} className="gap-y-7xl">
                    <LoadingContent isLoading={isLoading}>
                        <BudgetVerdict
                            projection={projection}
                            currencySymbol={currencySymbol}
                            periodEnd={periodEnd}
                            onPaceBannerPress={setHighlightTarget}
                        />
                    </LoadingContent>

                    <View className="gap-y-md">
                        <Text className="text-primary text-lg font-semibold">
                            <Trans>Category limits</Trans>
                        </Text>

                        <LoadingContent isLoading={isLoading} className="gap-y-md">
                            {categoryLimitsContent}
                        </LoadingContent>
                    </View>
                </View>
            </BudgetHighlightContext>
        </CollapsibleChromePage>
    );
};
