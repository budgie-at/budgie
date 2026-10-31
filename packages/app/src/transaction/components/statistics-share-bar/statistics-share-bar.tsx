import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { ChartLegend } from '../../../@generic/component/chart-legend/chart-legend';
import { cn } from '../../../@generic/utils/cn.util';

import type { StatisticsShareSegmentInterface } from '../../interface/statistics-share-segment.interface';

interface Props {
    readonly segments: readonly StatisticsShareSegmentInterface[];
}

const SEGMENT_TRANSITION_DURATION = 240;
const SEGMENT_TRANSITION = LinearTransition.duration(SEGMENT_TRANSITION_DURATION);

export const StatisticsShareBar = ({ segments }: Props) => {
    const legendItems = segments.map(segment => ({
        label: segment.label,
        swatchClassName: cn('size-[8px] rounded-full', segment.swatchClassName)
    }));

    return (
        <View className="gap-y-lg" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View className="h-[12px] flex-row gap-x-[2px] overflow-hidden rounded-full">
                {segments.map(segment => {
                    const segmentStyle = { flexGrow: segment.amount, flexBasis: 0 };

                    return (
                        <Animated.View
                            key={segment.key}
                            layout={SEGMENT_TRANSITION}
                            className={cn('h-full min-w-[3px]', segment.swatchClassName)}
                            style={segmentStyle}
                        />
                    );
                })}
            </View>

            <ChartLegend items={legendItems} />
        </View>
    );
};
