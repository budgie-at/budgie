import { View } from 'react-native';
import Animated, { interpolate, useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

import {
    LONG_PRESS_RING_FILL_COLOR,
    LONG_PRESS_RING_PADDING,
    LONG_PRESS_RING_ROTATION_OFFSET,
    LONG_PRESS_RING_STROKE_WIDTH,
    LONG_PRESS_RING_TRACK_COLOR,
    LONG_PRESS_RING_TRACK_OPACITY
} from '../../constant/long-press-brain.constant';
import { LongPressBrainPropsInterface } from '../../interface/long-press-brain-props-interface.type';
import { AiBrainProgress } from '../ai-brain-progress/ai-brain-progress';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const OPACITY_THRESHOLD = 0.01;
const FULL_OPACITY = 1;

export const LongPressBrain = ({ progress, size, iconSize, isAnimating = false, holdProgress }: LongPressBrainPropsInterface) => {
    const ringSize = size + LONG_PRESS_RING_PADDING * 2 + LONG_PRESS_RING_STROKE_WIDTH * 2;
    const ringCenter = ringSize / 2;
    const ringRadius = (ringSize - LONG_PRESS_RING_STROKE_WIDTH) / 2;
    const ringCircumference = 2 * Math.PI * ringRadius;

    const ringOffset = (ringSize - size) / 2;
    const containerStyle = { width: size, height: size };

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: ringCircumference * (1 - holdProgress.get())
    }));

    const ringOpacityStyle = useAnimatedStyle(() => ({
        opacity: interpolate(holdProgress.get(), [0, OPACITY_THRESHOLD], [0, FULL_OPACITY], 'clamp'),
        position: 'absolute' as const,
        top: -ringOffset,
        left: -ringOffset
    }));

    return (
        <View style={containerStyle}>
            <AiBrainProgress progress={progress} size={size} iconSize={iconSize} isAnimating={isAnimating} />
            <Animated.View style={ringOpacityStyle}>
                <Svg width={ringSize} height={ringSize}>
                    <Circle
                        cx={ringCenter}
                        cy={ringCenter}
                        r={ringRadius}
                        stroke={LONG_PRESS_RING_TRACK_COLOR}
                        strokeWidth={LONG_PRESS_RING_STROKE_WIDTH}
                        fill="none"
                        opacity={LONG_PRESS_RING_TRACK_OPACITY}
                    />
                    <AnimatedCircle
                        cx={ringCenter}
                        cy={ringCenter}
                        r={ringRadius}
                        stroke={LONG_PRESS_RING_FILL_COLOR}
                        strokeWidth={LONG_PRESS_RING_STROKE_WIDTH}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${ringCircumference}`}
                        rotation={LONG_PRESS_RING_ROTATION_OFFSET}
                        origin={`${ringCenter}, ${ringCenter}`}
                        animatedProps={animatedProps}
                    />
                </Svg>
            </Animated.View>
        </View>
    );
};
