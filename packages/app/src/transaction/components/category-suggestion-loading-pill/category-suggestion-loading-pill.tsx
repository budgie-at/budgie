import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
    Easing,
    FadeIn,
    interpolate,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';
import { useThemeContext } from '../../../theme/context/theme.context';
import { AnimatedDot } from '../animated-dot/animated-dot';

const PULSE_DURATION = 1200;
const SPARKLE_ROTATION_DURATION = 3000;
const DOT_STAGGER_DELAY = 150;

const PULSE_MIN_OPACITY = 0.6;
const PULSE_MAX_OPACITY = 1;
const PULSE_MIN_SCALE = 0.95;
const PULSE_MAX_SCALE = 1.05;
const FULL_ROTATION = 360;

const DOT_DELAYS = [0, DOT_STAGGER_DELAY, DOT_STAGGER_DELAY * 2];

export const CategorySuggestionLoadingPill = () => {
    const { t } = useLingui();
    const { isDarkColorSchema } = useThemeContext();

    const pulseProgress = useSharedValue(0);
    const sparkleRotation = useSharedValue(0);
    const glowProgress = useSharedValue(0);

    const secondaryColor = isDarkColorSchema ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)';
    const glowColorStart = isDarkColorSchema ? 'rgba(139, 92, 246, 0)' : 'rgba(139, 92, 246, 0)';
    const glowColorEnd = isDarkColorSchema ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)';

    useEffect(() => {
        pulseProgress.set(withRepeat(withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }), -1, true));
        sparkleRotation.set(
            withRepeat(withTiming(FULL_ROTATION, { duration: SPARKLE_ROTATION_DURATION, easing: Easing.linear }), -1, false)
        );
        glowProgress.set(withRepeat(withTiming(1, { duration: PULSE_DURATION, easing: Easing.inOut(Easing.ease) }), -1, true));
    }, [glowProgress, pulseProgress, sparkleRotation]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: interpolate(pulseProgress.value, [0, 1], [PULSE_MIN_OPACITY, PULSE_MAX_OPACITY]),
        transform: [{ scale: interpolate(pulseProgress.value, [0, 1], [PULSE_MIN_SCALE, PULSE_MAX_SCALE]) }]
    }));

    const sparkleStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${sparkleRotation.value}deg` }]
    }));

    const glowStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(glowProgress.value, [0, 1], [glowColorStart, glowColorEnd])
    }));

    const thinkingText = t`Thinking`;

    const dots = useMemo(
        () => DOT_DELAYS.map((delay, index) => <AnimatedDot key={index} delay={delay} color={secondaryColor} />),
        [secondaryColor]
    );

    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            className="flex-row items-center gap-sm px-md py-sm rounded-full border border-outline-secondary overflow-hidden"
        >
            <Animated.View className="absolute inset-0 rounded-full" style={glowStyle} />
            <Animated.View style={containerStyle} className="flex-row items-center gap-sm">
                <Animated.View style={sparkleStyle}>
                    <Icon icon={UserIconNameEnum.Sparkles} size={16} className="text-primary" />
                </Animated.View>
                <Animated.Text className="text-xs text-secondary-foreground font-medium">{thinkingText}</Animated.Text>
                <View className="flex-row gap-xs">{dots}</View>
            </Animated.View>
        </Animated.View>
    );
};
