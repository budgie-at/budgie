import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { light } from '../../../theme/provider/theme.provider';

interface Props {
    readonly onPress: () => void;
    readonly isAnimating?: boolean;
    readonly isLoading?: boolean;
    readonly isInitializing?: boolean;
    readonly downloadProgress?: number;
}

const ICON_SIZE = 32;
const PULSE_SCALE = 1.06;
const BUTTON_SIZE = 72;
const RING_SIZE = 88;
const STROKE_WIDTH = 3;
const RING_RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const ROTATION_OFFSET = -90;
const LOADING_COLOR = light['--color-secondary-foreground'];
const INITIALIZING_COLOR = light['--color-primary'];

const PULSE_DURATION = 1500;
const MIN_OPACITY = 0.4;
const MAX_OPACITY = 1;

export const AiButton = (props: Props) => {
    const { onPress, isAnimating = true, isLoading = false, isInitializing = false, downloadProgress = 0 } = props;

    const [, hapticImpact] = useVibration();

    const pulseScale = useSharedValue(1);
    const initOpacity = useSharedValue(MIN_OPACITY);

    useEffect(() => {
        if (isAnimating && !isLoading && !isInitializing) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(PULSE_SCALE, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        } else {
            pulseScale.value = withTiming(1, { duration: 200 });
        }
    }, [isAnimating, isLoading, isInitializing, pulseScale]);

    useEffect(() => {
        if (isInitializing) {
            initOpacity.value = withRepeat(
                withTiming(MAX_OPACITY, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
                -1,
                true
            );
        } else {
            initOpacity.value = MIN_OPACITY;
        }
    }, [isInitializing, initOpacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }]
    }));

    const initRingStyle = useAnimatedStyle(() => ({
        opacity: initOpacity.value
    }));

    const handlePress = () => {
        if (isLoading || isInitializing) {
            return;
        }
        hapticImpact(ImpactFeedbackStyle.Medium);
        onPress();
    };

    const strokeDashoffset = RING_CIRCUMFERENCE * (1 - downloadProgress);
    const containerStyle = { height: RING_SIZE, width: RING_SIZE };
    const buttonStyle = { width: BUTTON_SIZE, height: BUTTON_SIZE };
    const ringCenter = RING_SIZE / 2;
    const ringOrigin = `${ringCenter}, ${ringCenter}`;
    const isDisabled = isLoading || isInitializing;

    return (
        <Animated.View style={animatedStyle}>
            <View className="items-center justify-center" style={containerStyle}>
                {isLoading && !isInitializing && (
                    <View className="absolute items-center justify-center" style={containerStyle}>
                        <Svg height={RING_SIZE} width={RING_SIZE}>
                            <Circle
                                cx={ringCenter}
                                cy={ringCenter}
                                r={RING_RADIUS}
                                stroke={LOADING_COLOR}
                                strokeWidth={STROKE_WIDTH}
                                fill="none"
                                strokeDasharray={RING_CIRCUMFERENCE}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                rotation={ROTATION_OFFSET}
                                origin={ringOrigin}
                            />
                        </Svg>
                    </View>
                )}
                {isInitializing && (
                    <Animated.View className="absolute items-center justify-center" style={[containerStyle, initRingStyle]}>
                        <Svg height={RING_SIZE} width={RING_SIZE}>
                            <Circle
                                cx={ringCenter}
                                cy={ringCenter}
                                r={RING_RADIUS}
                                stroke={INITIALIZING_COLOR}
                                strokeWidth={STROKE_WIDTH}
                                fill="none"
                                strokeLinecap="round"
                            />
                        </Svg>
                    </Animated.View>
                )}
                <HapticPressable
                    className={`bg-primary rounded-full items-center justify-center shadow-lg shadow-black/30 ${isDisabled ? 'opacity-50' : ''}`}
                    style={buttonStyle}
                    onPress={handlePress}
                    disabled={isDisabled}
                >
                    <Icon className="text-primary-reverse" icon={UserIconNameEnum.Mic} size={ICON_SIZE} />
                </HapticPressable>
            </View>
        </Animated.View>
    );
};
