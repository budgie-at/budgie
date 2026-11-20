import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { MARKET_CHART_PADDING_X } from '../../../market-data/constant/market-chart-padding-x.constant';
import { YIELD_AXIS_GUTTER } from '../../constant/yield-axis-gutter.constant';
import { YIELD_CHART_TICKS_HEIGHT } from '../../constant/yield-chart-ticks-height.constant';
import { YIELD_FOOTNOTE_HEIGHT } from '../../constant/yield-footnote-height.constant';
import { YIELD_LABEL_BAND, YIELD_PLOT_BOTTOM_GAP } from '../../constant/yield-label-band.constant';
import { YIELD_LEGEND_HEADER_HEIGHT, YIELD_LEGEND_HINT_HEIGHT } from '../../constant/yield-legend-header-height.constant';
import { YIELD_LEGEND_ROW_HEIGHT } from '../../constant/yield-legend-row-height.constant';
import { YIELD_NEGATIVE_BAND } from '../../constant/yield-negative-band.constant';
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
const ZERO_Y = YIELD_PLOT_HEIGHT - YIELD_NEGATIVE_BAND;
const GRID_LINES = [
    { id: 'top', style: { top: 1 }, className: 'bg-primary opacity-[0.08]' },
    { id: 'mid', style: { top: ZERO_Y / 2 }, className: 'bg-primary opacity-[0.08]' },
    { id: 'zero', style: { top: ZERO_Y }, className: 'bg-primary opacity-40' }
] as const;
const LABEL_HEIGHT = 8;
const LABEL_CENTER_OFFSET = 8;
const AXIS_LABELS = GRID_LINES.map(({ id, style }) => ({ id, style: { top: style.top - LABEL_CENTER_OFFSET, height: LABEL_HEIGHT } }));
const FRAME_STYLE = { height: YIELD_PLOT_HEIGHT + YIELD_LABEL_BAND };
const PLOT_STYLE = { marginTop: YIELD_LABEL_BAND, height: YIELD_PLOT_HEIGHT };
const BARS_STYLE = { height: ZERO_Y, paddingHorizontal: MARKET_CHART_PADDING_X };
const SLOT_STYLE = { height: ZERO_Y };
const GUTTER_STYLE = { width: YIELD_AXIS_GUTTER, marginTop: YIELD_LABEL_BAND, height: YIELD_PLOT_HEIGHT };
const TICKS_ROW_STYLE = { height: YIELD_CHART_TICKS_HEIGHT, marginTop: YIELD_PLOT_BOTTOM_GAP, paddingRight: YIELD_AXIS_GUTTER };
const LEGEND_ROW_STYLE = { height: YIELD_LEGEND_ROW_HEIGHT };
const LEGEND_HEADER_STYLE = { height: YIELD_LEGEND_HEADER_HEIGHT };
const LEGEND_HINT_STYLE = { height: YIELD_LEGEND_HINT_HEIGHT };
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
                <View className="flex-row" style={FRAME_STYLE}>
                    <View className="flex-1" style={PLOT_STYLE}>
                        {GRID_LINES.map(line => (
                            <View key={line.id} className={cn('absolute right-0 left-0 h-hairline', line.className)} style={line.style} />
                        ))}
                        <View className="flex-row" style={BARS_STYLE}>
                            {BARS.map(bar => (
                                <View key={bar.id} className="flex-1 items-center justify-end" style={SLOT_STYLE}>
                                    <View className="w-[60%] rounded-t-sm bg-secondary-corner" style={bar.style} />
                                </View>
                            ))}
                        </View>
                    </View>
                    <View style={GUTTER_STYLE}>
                        {AXIS_LABELS.map(label => (
                            <View
                                key={label.id}
                                className="absolute right-0 w-[28px] rounded-full bg-secondary-corner"
                                style={label.style}
                            />
                        ))}
                    </View>
                </View>
                <View className="flex-row items-center justify-between" style={TICKS_ROW_STYLE}>
                    {TICKS.map(tick => (
                        <View key={tick} className="h-[10px] w-[32px] rounded-full bg-secondary-corner" />
                    ))}
                </View>
            </View>
            <View className="gap-y-xs">
                <View className="justify-center" style={LEGEND_HEADER_STYLE}>
                    <View className="h-[12px] w-[96px] rounded-full bg-secondary-corner" />
                </View>
                {LEGEND_ROWS.map(row => (
                    <View key={row} className="flex-row items-center gap-x-[8px]" style={LEGEND_ROW_STYLE}>
                        <View className="size-[10px] rounded-full bg-secondary-corner" />
                        <View className="h-[14px] flex-1 rounded-full bg-secondary-corner" />
                        <View className="h-[14px] w-[56px] rounded-full bg-secondary-corner" />
                    </View>
                ))}
                <View className="justify-center" style={LEGEND_HINT_STYLE}>
                    <View className="h-[12px] w-[128px] rounded-full bg-secondary-corner" />
                </View>
            </View>
            <View className="justify-center" style={FOOTNOTE_STYLE}>
                <View className="h-[12px] w-7/12 rounded-full bg-secondary-corner" />
            </View>
        </Animated.View>
    );
};
