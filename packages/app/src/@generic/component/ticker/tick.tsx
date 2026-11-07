import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { EASE_OUT } from '../../constant/motion.constant';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';
import { getTextStyleForTicket } from '../../utils/get-text-style-for-ticket.util';

interface Props {
    readonly num: number;
    readonly textSize: number;
    readonly textClassName?: string;
    readonly index: number;
    readonly duration?: number;
    readonly delay?: number;
}

const TICK_DURATION = 320;
const TICK_STAGGER = 24;
const TICK_MAX_STAGGER_STEPS = 6;
const NUM_FROM_ZERO_TO_NINE = [...Array(10).keys()];

export const Tick = (props: Props) => {
    const { num, textSize, textClassName, index, duration = TICK_DURATION, delay = TICK_STAGGER } = props;

    const reducedMotion = useReducedMotion();
    const translateY = useSharedValue(-textSize * num);
    const renderedNumRef = useRef(num);

    useEffect(() => {
        const target = -textSize * num;

        if (renderedNumRef.current === num || reducedMotion) {
            renderedNumRef.current = num;
            translateY.set(target);

            return;
        }

        renderedNumRef.current = num;
        translateY.set(withDelay(delay * Math.min(index, TICK_MAX_STAGGER_STEPS), withTiming(target, { duration, easing: EASE_OUT })));
    }, [num, textSize, index, translateY, delay, duration, reducedMotion]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }]
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
