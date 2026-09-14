import { RUNWAY_MAX_MONTHS } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { RUNWAY_HORIZON_MONTHS } from '../../constant/runway-horizon-months.constant';

interface Props {
    readonly months: number | null;
}

const GRADIENT_ID = 'runway-meter-fill';
const GRADIENT_STOPS = [
    { offset: '0%', color: '#00ff88' },
    { offset: '45%', color: '#7ddb4f' },
    { offset: '78%', color: '#f0b100' },
    { offset: '100%', color: '#ff8a00' }
] as const;
const FULL_PERCENT = 100;
const FILL_DURATION = 400;
const FILL_EASING_X1 = 0.23;
const FILL_EASING_Y1 = 1;
const FILL_EASING_X2 = 0.32;
const FILL_EASING_Y2 = 1;
const FILL_EASING = Easing.bezier(FILL_EASING_X1, FILL_EASING_Y1, FILL_EASING_X2, FILL_EASING_Y2);

export const RunwayMeter = ({ months }: Props) => {
    const formatDigits = useFormatDigits(0);
    const reducedMotion = useReducedMotion();

    const clampedMonths = Math.min(Math.max(months ?? 0, 0), RUNWAY_MAX_MONTHS);
    const emptyWidth = `${FULL_PERCENT - (clampedMonths / RUNWAY_MAX_MONTHS) * FULL_PERCENT}%` as const;
    const maskStyle = useAnimatedStyle(() => ({
        width: reducedMotion ? emptyWidth : withTiming(emptyWidth, { duration: FILL_DURATION, easing: FILL_EASING })
    }));

    return (
        <View>
            <View className="h-3 overflow-hidden rounded-full bg-secondary-corner">
                <Svg width="100%" height="100%">
                    <Defs>
                        <LinearGradient id={GRADIENT_ID} x1="0" y1="0" x2="1" y2="0">
                            {GRADIENT_STOPS.map(stop => (
                                <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                            ))}
                        </LinearGradient>
                    </Defs>
                    <Rect width="100%" height="100%" fill={`url(#${GRADIENT_ID})`} />
                </Svg>
                <Animated.View className="absolute bottom-0 right-0 top-0 rounded-l-full bg-secondary-corner" style={maskStyle} />
            </View>

            <View className="mt-sm flex-row justify-between">
                {RUNWAY_HORIZON_MONTHS.map((tick, index) => (
                    <Text key={tick} className="text-xxs text-secondary-foreground">
                        {index === 0 ? <Trans>now</Trans> : formatDigits(tick)}
                    </Text>
                ))}
            </View>
        </View>
    );
};
