import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { useSkeletonPulseStyle } from '../../../@generic/hook/use-skeleton-pulse-style/use-skeleton-pulse-style.hook';

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

const LEGEND_ROWS = ['first', 'second'] as const;
const LEGEND_COLUMNS = ['left', 'right'] as const;

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
            <View className="h-[220px] flex-row items-end gap-x-xs pt-[20px]">
                {BARS.map(bar => (
                    <View key={bar.id} className="flex-1 rounded-t-md bg-secondary-corner" style={bar.style} />
                ))}
            </View>
            <View>
                {LEGEND_ROWS.map(row => (
                    <View key={row} className="min-h-[44px] flex-row items-center gap-x-xl">
                        {LEGEND_COLUMNS.map(column => (
                            <View key={column} className="h-[14px] flex-1 rounded-full bg-secondary-corner" />
                        ))}
                    </View>
                ))}
            </View>
            <View className="h-[14px] w-7/12 rounded-full bg-secondary-corner" />
        </Animated.View>
    );
};
