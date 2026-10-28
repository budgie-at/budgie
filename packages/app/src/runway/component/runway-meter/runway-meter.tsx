import { RUNWAY_MAX_MONTHS } from '@budgie/contracts';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useResolveClassNames } from 'uniwind';

import { GrowBar } from '../../../@generic/component/grow-bar/grow-bar';
import { RUNWAY_HORIZON_MONTHS } from '../../constant/runway-horizon-months.constant';
import { RunwayMeterTick } from '../runway-meter-tick/runway-meter-tick';

import type { StatusToneType } from '../../../@generic/type/status-tone.type';
import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly months: number | null;
    readonly tone: Extract<StatusToneType, 'positive' | 'destructive'>;
}

const GRADIENT_ID = 'runway-meter-fill';
const GRADIENT_COLORS = {
    destructive: { from: 'bg-destructive-fill', to: 'bg-warning-fill', fromOpacity: 1 },
    positive: { from: 'bg-positive-fill', to: 'bg-positive-fill', fromOpacity: 0.6 }
} as const;

export const RunwayMeter = ({ months, tone }: Props) => {
    const { from, to, fromOpacity } = GRADIENT_COLORS[tone];
    const { backgroundColor: fromColor } = useResolveClassNames(from);
    const { backgroundColor: toColor } = useResolveClassNames(to);

    const [trackWidth, setTrackWidth] = useState(0);
    const ratio = Math.min(Math.max(months ?? 0, 0), RUNWAY_MAX_MONTHS) / RUNWAY_MAX_MONTHS;

    const handleTrackLayout = (event: LayoutChangeEvent) => {
        setTrackWidth(event.nativeEvent.layout.width);
    };

    return (
        <View>
            <View className="h-[14px] overflow-hidden rounded-[3px] bg-secondary-corner" onLayout={handleTrackLayout}>
                <GrowBar ratio={ratio} className="h-full overflow-hidden rounded-[3px]">
                    <Svg width={trackWidth} height="100%">
                        <Defs>
                            <LinearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0" stopColor={fromColor} stopOpacity={fromOpacity} />
                                <Stop offset="1" stopColor={toColor} />
                            </LinearGradient>
                        </Defs>
                        <Rect width="100%" height="100%" fill={`url(#${GRADIENT_ID})`} />
                    </Svg>
                </GrowBar>
            </View>

            <View className="relative mt-sm h-4">
                {RUNWAY_HORIZON_MONTHS.map((tick, index) => (
                    <RunwayMeterTick key={tick} index={index} />
                ))}
            </View>
        </View>
    );
};
