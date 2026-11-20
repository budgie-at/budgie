import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';
import { YIELD_AXIS_GUTTER } from '../../constant/yield-axis-gutter.constant';
import { YIELD_CHART_TICKS_HEIGHT } from '../../constant/yield-chart-ticks-height.constant';
import { YIELD_FOOTNOTE_HEIGHT } from '../../constant/yield-footnote-height.constant';
import { YIELD_LABEL_BAND, YIELD_PLOT_BOTTOM_GAP } from '../../constant/yield-label-band.constant';
import { YIELD_LEGEND_ROW_HEIGHT } from '../../constant/yield-legend-row-height.constant';
import { YIELD_PLOT_HEIGHT } from '../../constant/yield-plot-height.constant';

const BARS = [
    { id: 'a', style: { height: '40%' } },
    { id: 'b', style: { height: '65%' } },
    { id: 'c', style: { height: '50%' } },
    { id: 'd', style: { height: '85%' } },
    { id: 'e', style: { height: '60%' } },
    { id: 'f', style: { height: '75%' } },
    { id: 'g', style: { height: '45%' } },
    { id: 'h', style: { height: '90%' } },
    { id: 'i', style: { height: '55%' } },
    { id: 'j', style: { height: '70%' } },
    { id: 'k', style: { height: '35%' } },
    { id: 'l', style: { height: '60%' } }
] as const;

const LEGEND_ROWS = ['first', 'second', 'third', 'fourth', 'fifth'] as const;
const TICKS = ['a', 'b', 'c', 'd'] as const;
const PLOT_STYLE = { height: YIELD_PLOT_HEIGHT + YIELD_LABEL_BAND, paddingRight: YIELD_AXIS_GUTTER, paddingTop: YIELD_LABEL_BAND };
const BARS_STYLE = { height: YIELD_PLOT_HEIGHT };
const TICKS_STYLE = { height: YIELD_CHART_TICKS_HEIGHT, marginTop: YIELD_PLOT_BOTTOM_GAP, paddingRight: YIELD_AXIS_GUTTER };
const LEGEND_ROW_STYLE = { height: YIELD_LEGEND_ROW_HEIGHT };
const FOOTNOTE_STYLE = { height: YIELD_FOOTNOTE_HEIGHT };

const BUSY_STATE = { busy: true };

export const YieldChartPlotSkeleton = () => {
    const pulseStyle = useSkeletonPulseStyle();

    return (
        <Animated.View
            style={pulseStyle}
            className="gap-y-[12px]"
            pointerEvents="none"
            accessibilityState={BUSY_STATE}
            importantForAccessibility="no-hide-descendants"
        >
            <View>
                <View style={PLOT_STYLE}>
                    <View className="flex-row items-end gap-x-xs" style={BARS_STYLE}>
                        {BARS.map(bar => (
                            <View key={bar.id} className="flex-1 rounded-t-md bg-secondary-corner" style={bar.style} />
                        ))}
                    </View>
                </View>
                <View className="flex-row items-center justify-between" style={TICKS_STYLE}>
                    {TICKS.map(tick => (
                        <View key={tick} className="h-[10px] w-[32px] rounded-full bg-secondary-corner" />
                    ))}
                </View>
            </View>
            <View>
                {LEGEND_ROWS.map(row => (
                    <View key={row} className="flex-row items-center gap-x-[8px]" style={LEGEND_ROW_STYLE}>
                        <View className="size-[10px] rounded-full bg-secondary-corner" />
                        <View className="h-[14px] flex-1 rounded-full bg-secondary-corner" />
                        <View className="h-[14px] w-[56px] rounded-full bg-secondary-corner" />
                    </View>
                ))}
            </View>
            <View className="justify-center" style={FOOTNOTE_STYLE}>
                <View className="h-[12px] w-7/12 rounded-full bg-secondary-corner" />
            </View>
        </Animated.View>
    );
};
