import { useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { use } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { EASE_OUT } from '../../../@generic/constant/motion.constant';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { YIELD_LEGEND_HEADER_HEIGHT } from '../../constant/yield-legend-header-height.constant';
import { YIELD_RANGE_PERIOD_LABEL } from '../../constant/yield-range-period-label.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldSelectionContext } from '../../context/yield-selection.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { useYieldSummary } from '../../hook/use-yield-summary.hook';

import type { ReactNode } from 'react';

interface Props {
    readonly hint?: ReactNode;
}

const HEADER_STYLE = { minHeight: YIELD_LEGEND_HEADER_HEIGHT };
const CROSS_FADE_DURATION = 150;
const MAX_FONT_SIZE_MULTIPLIER = 1.5;

export const YieldLegendHeader = ({ hint = null }: Props) => {
    const { t } = useLingui();
    const { screenKey, mode } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);
    const summary = useYieldSummary();
    const reducedMotion = useReducedMotion();
    const { formatPeriod } = useYieldDateLabels();
    const { formatDayAndMonthAndYear } = useFormatDate();

    const bucket = isDefined(selectedIndex) ? (summary?.buckets.at(selectedIndex) ?? null) : null;
    const throughDay = isDefined(bucket) ? formatDayAndMonthAndYear(parseISO(bucket.end)) : '';
    const period = isDefined(bucket) && isDefined(summary) ? formatPeriod(bucket, summary.bucketUnit) : '';
    const scrubText = mode === YieldChartModeEnum.RUNNING_TOTAL ? t`Through ${throughDay}` : period;
    const text = isDefined(bucket) ? scrubText : t(YIELD_RANGE_PERIOD_LABEL[screenKey.key.range]);
    const entering = FadeIn.duration(reducedMotion ? 0 : CROSS_FADE_DURATION).easing(EASE_OUT);

    return (
        <View className="flex-row items-baseline justify-between gap-x-md" style={HEADER_STYLE}>
            <Animated.View key={text} entering={entering} className="min-w-0 shrink">
                <Text className="text-[13px] text-secondary-foreground" maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} numberOfLines={1}>
                    {text}
                </Text>
            </Animated.View>
            {hint}
        </View>
    );
};
