 
import { useEffect } from 'react';
import Animated, {
    Easing,
    SharedValue,
    cancelAnimation,
    useAnimatedProps,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import { AI_SYSTEM_STATE_VISUALS } from '../../constant/ai-system-state-visuals.constant';
import {
    LONG_PRESS_RING_FILL_COLOR,
    LONG_PRESS_RING_PADDING,
    LONG_PRESS_RING_ROTATION_OFFSET,
    LONG_PRESS_RING_STROKE_WIDTH,
    LONG_PRESS_RING_TRACK_COLOR,
    LONG_PRESS_RING_TRACK_OPACITY
} from '../../constant/long-press-brain.constant';
import { AiSystemStateEnum } from '../../enum/ai-system-state.enum';
import { AiBrainProgress } from '../ai-brain-progress/ai-brain-progress';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const OPACITY_THRESHOLD = 0.01;
const FULL_OPACITY = 1;
const DIMMED_OPACITY = 0.6;
const HALF = 2;
 
const SVG_FILL_NONE = 'none' as const;
 
const SVG_STROKE_LINECAP_ROUND = 'round' as const;
 
const POSITION_ABSOLUTE = 'absolute' as const;

interface Props {
    readonly state: AiSystemStateEnum;
    readonly percent: number;
    readonly holdProgress: SharedValue<number>;
    readonly size: number;
    readonly iconSize: number;
}

 
export const AiSystemBrain = ({ state, percent, holdProgress, size, iconSize }: Props) => {
    const reducedMotion = useReducedMotion();
    const visuals = AI_SYSTEM_STATE_VISUALS[state];
    const pulseValue = useSharedValue(FULL_OPACITY);

    useEffect(() => {
        cancelAnimation(pulseValue);
        if (reducedMotion || visuals.pulsePeriodMs === null) {
            pulseValue.value = FULL_OPACITY;

            return;
        }
        pulseValue.value = withRepeat(
            withTiming(DIMMED_OPACITY, { duration: visuals.pulsePeriodMs / HALF, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, [pulseValue, reducedMotion, visuals.pulsePeriodMs]);

    const pulseStyle = useAnimatedStyle(() => ({ opacity: pulseValue.value }));

    const ringSize = size + LONG_PRESS_RING_PADDING * HALF + LONG_PRESS_RING_STROKE_WIDTH * HALF;
    const ringCenter = ringSize / HALF;
    const ringRadius = (ringSize - LONG_PRESS_RING_STROKE_WIDTH) / HALF;
    const ringCircumference = HALF * Math.PI * ringRadius;
    const ringOffset = (ringSize - size) / HALF;
    const containerStyle = { width: size, height: size };
    const wrapperStyle = [containerStyle, pulseStyle];

    const holdAnimatedProps = useAnimatedProps(() => ({
        strokeDashoffset: ringCircumference * (1 - holdProgress.get())
    }));

    const holdRingStyle = useAnimatedStyle(() => ({
        opacity: holdProgress.get() > OPACITY_THRESHOLD ? FULL_OPACITY : 0,
        position: POSITION_ABSOLUTE,
        top: -ringOffset,
        left: -ringOffset
    }));

    return (
        <Animated.View style={wrapperStyle} className={visuals.colorClass}>
            <AiBrainProgress progress={percent} size={size} iconSize={iconSize} isAnimating={visuals.pulsePeriodMs !== null} />
            <Animated.View style={holdRingStyle}>
                <Svg width={ringSize} height={ringSize}>
                    <Circle
                        cx={ringCenter}
                        cy={ringCenter}
                        r={ringRadius}
                        stroke={LONG_PRESS_RING_TRACK_COLOR}
                        strokeWidth={LONG_PRESS_RING_STROKE_WIDTH}
                        fill={SVG_FILL_NONE}
                        opacity={LONG_PRESS_RING_TRACK_OPACITY}
                    />
                    <AnimatedCircle
                        cx={ringCenter}
                        cy={ringCenter}
                        r={ringRadius}
                        stroke={LONG_PRESS_RING_FILL_COLOR}
                        strokeWidth={LONG_PRESS_RING_STROKE_WIDTH}
                        fill={SVG_FILL_NONE}
                        strokeLinecap={SVG_STROKE_LINECAP_ROUND}
                        strokeDasharray={`${ringCircumference}`}
                        rotation={LONG_PRESS_RING_ROTATION_OFFSET}
                        origin={`${ringCenter}, ${ringCenter}`}
                        animatedProps={holdAnimatedProps}
                    />
                </Svg>
            </Animated.View>
        </Animated.View>
    );
};
