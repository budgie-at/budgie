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

export const AiButton = (props: Props) => {
    const { onPress, isAnimating = true, isLoading = false, downloadProgress = 0 } = props;

    const [, hapticImpact] = useVibration();

    const pulseScale = useSharedValue(1);

    useEffect(() => {
        if (isAnimating && !isLoading) {
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
    }, [isAnimating, isLoading, pulseScale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }]
    }));

    const handlePress = () => {
        if (isLoading) {
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

    return (
        <Animated.View style={animatedStyle}>
            <View className="items-center justify-center" style={containerStyle}>
                {isLoading && (
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
                <HapticPressable
                    className={`bg-primary rounded-full items-center justify-center shadow-lg shadow-black/30 ${isLoading ? 'opacity-50' : ''}`}
                    style={buttonStyle}
                    onPress={handlePress}
                    disabled={isLoading}
                >
                    <Icon className="text-primary-reverse" icon={UserIconNameEnum.Mic} size={ICON_SIZE} />
                </HapticPressable>
            </View>
        </Animated.View>
    );
};
