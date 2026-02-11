import { UserIconNameEnum } from '@budgie/contracts';
import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';

const FILL_ANIMATION_DURATION = 300;
const PERCENT_DIVISOR = 100;
const PULSE_SCALE = 1.08;
const PULSE_DURATION = 1000;
const PULSE_STOP_DURATION = 200;

const styles = StyleSheet.create({
    iconPosition: { position: 'absolute', bottom: 0, left: 0 }
});

interface Props {
    readonly progress: number;
    readonly size: number;
    readonly iconSize: number;
    readonly isAnimating?: boolean;
}

export const AiBrainProgress = ({ progress, size, iconSize, isAnimating = false }: Props) => {
    const fillHeight = useSharedValue((progress / PERCENT_DIVISOR) * iconSize);
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        fillHeight.value = withTiming((progress / PERCENT_DIVISOR) * iconSize, { duration: FILL_ANIMATION_DURATION });
    }, [progress, iconSize, fillHeight]);

    useEffect(() => {
        if (isAnimating) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(PULSE_SCALE, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        } else {
            pulseScale.value = withTiming(1, { duration: PULSE_STOP_DURATION });
        }
    }, [isAnimating, pulseScale]);

    const clipStyle = useAnimatedStyle(() => ({
        position: 'absolute' as const,
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden' as const,
        height: fillHeight.value
    }));

    const containerStyle = useAnimatedStyle(() => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        transform: [{ scale: pulseScale.value }]
    }));
    const iconWrapperStyle: ViewStyle = { width: iconSize, height: iconSize };

    return (
        <Animated.View className="items-center justify-center bg-ghost-background" style={containerStyle}>
            <View style={iconWrapperStyle}>
                <Icon className="text-secondary-foreground opacity-60" icon={UserIconNameEnum.Brain} size={iconSize} />
                <Animated.View style={clipStyle}>
                    <Icon className="text-positive-foreground" icon={UserIconNameEnum.Brain} size={iconSize} style={styles.iconPosition} />
                </Animated.View>
            </View>
        </Animated.View>
    );
};
