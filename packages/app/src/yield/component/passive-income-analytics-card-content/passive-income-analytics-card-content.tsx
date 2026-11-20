import { UserIconNameEnum } from '@budgie/contracts';
import { YieldRangeEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { yieldSummaryFamily } from '../../constant/yield-summary-family-atom.constant';
import { useYieldAnalyticsPeriodLabel } from '../../hook/use-yield-analytics-period-label.hook';
import { useYieldAnalyticsTakeaway } from '../../hook/use-yield-analytics-takeaway.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldChartMini } from '../yield-chart-mini/yield-chart-mini';

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
    const { t } = useLingui();
    const { id: baseInstrumentId, symbol } = useAtomValue(defaultInstrumentAtom);
    const formatAmount = useProtectedAmountLabel();
    const summary = AsyncResult.getOrElse(
        useLiveAtomValue(
            yieldSummaryFamily({ range: focus.range, positionAccountId: null, instrumentId: null, group: null, baseInstrumentId })
        ),
        () => null
    );

    const periodLabel = useYieldAnalyticsPeriodLabel(focus, period);
    const takeaway = useYieldAnalyticsTakeaway(summary, focus.range);

    const handlePress = () =>
        void router.push({
            pathname: '/passive-income',
            params: {
                range: focus.range,
                ...(isDefined(focus.focusDay) ? { focus: focus.focusDay } : { periodFrom: period.fromDay, periodTo: period.toDay })
            }
        });

    const approximate = earned.isEstimated ? '≈ ' : '';
    const amount = formatAmount(earned.value, symbol);
    const title = t`Passive income`;
    const chartTitles: Record<YieldRangeEnum, string> = {
        [YieldRangeEnum.MONTH]: t`Last 30 days`,
        [YieldRangeEnum.QUARTER]: t`Last 13 weeks`,
        [YieldRangeEnum.YEAR]: t`Last 12 months`,
        [YieldRangeEnum.ALL]: t`All time`
    };
    const accessibilityLabel = `${title}, ${approximate}${amount} ${periodLabel}${isDefined(takeaway) ? `, ${takeaway}` : ''}`;

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
                    <Text className="text-lg font-semibold tabular-nums text-primary">
                        {approximate}
                        {amount}
                    </Text>
                    {` ${periodLabel}`}
                </Text>
                <Text className="text-xs text-secondary-foreground" maxFontSizeMultiplier={1.5}>
                    {chartTitles[focus.range]}
                </Text>
            </View>
            {isDefined(summary) ? (
                <YieldChartMini buckets={summary.buckets} focusDay={focus.focusDay} range={focus.range} />
            ) : (
                <View className="h-[32px]" />
            )}
            {isDefined(takeaway) ? (
                <Text className="text-xs font-medium tabular-nums text-secondary-foreground" maxFontSizeMultiplier={1.5}>
                    {takeaway}
                </Text>
            ) : null}
        </HapticPressable>
    );
};
