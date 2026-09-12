import { RUNWAY_MAX_MONTHS } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { RUNWAY_METER_NEGATIVE_STOPS, RUNWAY_METER_POSITIVE_STOPS } from '../../constant/runway-chart-colors.constant';

interface Props {
    readonly months: number | null;
    readonly isPositive: boolean;
}

const RUNWAY_METER_TICK_MONTHS = [0, 3, 6, 9, RUNWAY_MAX_MONTHS] as const;
const RUNWAY_METER_KNOB_SIZE = 20;
const RUNWAY_METER_GRADIENT_ID = 'runway-meter-fill';

export const RunwayMeter = ({ months, isPositive }: Props) => {
    const formatDigits = useFormatDigits(0);

    const clampedMonths = isPositive ? RUNWAY_MAX_MONTHS : Math.min(Math.max(months ?? 0, 0), RUNWAY_MAX_MONTHS);
    const fillPercent = (clampedMonths / RUNWAY_MAX_MONTHS) * 100;
    const stops = isPositive ? RUNWAY_METER_POSITIVE_STOPS : RUNWAY_METER_NEGATIVE_STOPS;
    const fillStyle: ViewStyle = { width: `${fillPercent}%` };
    const knobStyle: ViewStyle = {
        left: `${fillPercent}%`,
        marginLeft: -RUNWAY_METER_KNOB_SIZE / 2,
        marginTop: -RUNWAY_METER_KNOB_SIZE / 2
    };

    return (
        <View className="relative">
            <View className="h-3 overflow-hidden rounded-full bg-secondary-corner">
                <View className="h-full overflow-hidden rounded-full" style={fillStyle}>
                    <Svg width="100%" height="100%">
                        <Defs>
                            <LinearGradient id={RUNWAY_METER_GRADIENT_ID} x1="0" y1="0" x2="1" y2="0">
                                {stops.map(stop => (
                                    <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                                ))}
                            </LinearGradient>
                        </Defs>
                        <Rect width="100%" height="100%" fill={`url(#${RUNWAY_METER_GRADIENT_ID})`} />
                    </Svg>
                </View>
            </View>

            <View className="absolute top-1/2 h-5 w-5 rounded-full bg-white shadow-lg" style={knobStyle} />

            <View className="mt-sm flex-row justify-between">
                {RUNWAY_METER_TICK_MONTHS.map((tick, index) => (
                    <Text key={tick} className="text-xxs text-secondary-foreground">
                        {index === 0 ? <Trans>now</Trans> : formatDigits(tick)}
                    </Text>
                ))}
            </View>
        </View>
    );
};
