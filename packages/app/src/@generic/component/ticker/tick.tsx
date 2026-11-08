import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { EASE_OUT } from '../../constant/motion.constant';
import { TickerMotionEnum } from '../../enum/ticker-motion.enum';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';
import { getTextStyleForTicket } from '../../utils/get-text-style-for-ticket.util';

interface Props {
    readonly num: number;
    readonly textSize: number;
    readonly textClassName?: string;
    readonly index: number;
    readonly motion?: TickerMotionEnum;
}

const TICK_DURATION = 320;
const TICK_STAGGER = 24;
const TICK_MAX_STAGGER_STEPS = 6;
const NUM_FROM_ZERO_TO_NINE = [...Array(10).keys()];

export const Tick = (props: Props) => {
    const { num, textSize, textClassName, index, motion = TickerMotionEnum.SLIDE } = props;

    const reducedMotion = useReducedMotion();
    const rollsOnMount = motion === TickerMotionEnum.ROLL;
    const isAnimated = motion !== TickerMotionEnum.NONE;
    const duration = isAnimated ? TICK_DURATION : 0;
    const delay = isAnimated ? TICK_STAGGER : 0;
    const translateY = useSharedValue(rollsOnMount ? 0 : -textSize * num);
    const renderedNumRef = useRef(num);
    const isMountRollPendingRef = useRef(rollsOnMount);

    useEffect(() => {
        const target = -textSize * num;
        const isMountRoll = isMountRollPendingRef.current && !reducedMotion && duration > 0;

        isMountRollPendingRef.current = false;

        if (isMountRoll) {
            translateY.set(
                withDelay(
                    delay * Math.min(index, TICK_MAX_STAGGER_STEPS),
                    withTiming(target, { duration: TICK_DURATION, easing: EASE_OUT })
                )
            );

            return;
        }

        if (renderedNumRef.current === num || reducedMotion) {
            renderedNumRef.current = num;
            translateY.set(target);

            return;
        }

        renderedNumRef.current = num;
        translateY.set(withDelay(delay * Math.min(index, TICK_MAX_STAGGER_STEPS), withTiming(target, { duration, easing: EASE_OUT })));
    }, [num, textSize, index, translateY, delay, duration, reducedMotion]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.get() }]
    }));

    const textStyle = getTextStyleForTicket(textSize);
    const style = { height: textSize, overflow: 'hidden' } as const;

    return (
        <View style={style}>
            <Animated.View style={animatedStyle}>
                {NUM_FROM_ZERO_TO_NINE.map((number, index) => (
                    <Text key={index} allowFontScaling={false} className={textClassName} style={textStyle}>
                        {number}
                    </Text>
                ))}
            </Animated.View>
        </View>
    );
};
