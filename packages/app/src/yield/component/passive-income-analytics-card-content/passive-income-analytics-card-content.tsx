import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { useYieldAnalyticsCardText } from '../../hook/use-yield-analytics-card-text.hook';
import { useYieldHeroTrend } from '../../hook/use-yield-hero-trend.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldChartMini } from '../yield-chart-mini/yield-chart-mini';
import { YieldDeltaPill } from '../yield-delta-pill/yield-delta-pill';

import type { YieldAnalyticsFocusInterface } from '../../interface/yield-analytics-focus.interface';
import type { YieldPeriodInterface } from '../../interface/yield-period.interface';
import type { YieldEstimatedFigureInterface } from '@budgie/market';

interface Props {
    readonly earned: YieldEstimatedFigureInterface;
    readonly focus: YieldAnalyticsFocusInterface;
    readonly period: YieldPeriodInterface;
}

const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const PassiveIncomeAnalyticsCardContent = ({ earned, focus, period }: Props) => {
    const { id: baseInstrumentId } = useAtomValue(defaultInstrumentAtom);
    const summary = AsyncResult.getOrElse(
        useLiveAtomValue(
            yieldSummaryFamily({ range: focus.range, positionAccountId: null, instrumentId: null, group: null, baseInstrumentId })
        ),
        () => null
    );

    const { title, headlineText, caption, focusedText, takeaway, accessibilityLabel } = useYieldAnalyticsCardText(
        summary,
        earned,
        focus,
        period
    );
    const { tone } = useYieldHeroTrend(summary);

    const handlePress = () =>
        void router.push({
            pathname: '/passive-income',
            params: {
                range: focus.range,
                ...(isDefined(focus.focusDay) ? { focus: focus.focusDay } : { periodFrom: period.fromDay, periodTo: period.toDay })
            }
        });

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={handlePress}
            testID={PassiveIncomeSelector.AnalyticsCard}
            className="gap-y-md rounded-3xl bg-surface-row p-[16px]"
            style={CONTINUOUS_CORNERS}
        >
            <View className="flex-row items-center justify-between">
                <Text className="text-md font-semibold text-primary">{title}</Text>
                <Icon icon={UserIconNameEnum.ChevronRight} size={16} className="text-secondary-foreground" />
            </View>
            <View className="gap-y-xxs">
                <Text className="text-xs text-secondary-foreground" maxFontSizeMultiplier={1.5}>
                    <Text className="text-lg font-semibold tabular-nums text-primary">{headlineText}</Text>
                    {` ${caption}`}
                </Text>
                {isDefined(focusedText) ? (
                    <Text className="text-[13px] tabular-nums text-secondary-foreground" maxFontSizeMultiplier={1.5}>
                        {focusedText}
                    </Text>
                ) : null}
            </View>
            {isDefined(summary) ? (
                <YieldChartMini buckets={summary.buckets} focusDay={focus.focusDay} range={focus.range} />
            ) : (
                <View className="h-[32px]" />
            )}
            {isDefined(takeaway) ? <YieldDeltaPill label={takeaway} tone={tone} maxFontSizeMultiplier={1.5} /> : null}
        </HapticPressable>
    );
};
