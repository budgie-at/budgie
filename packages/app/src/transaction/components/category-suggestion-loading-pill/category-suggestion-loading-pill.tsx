import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';

const styles = StyleSheet.create({
    gradient: {
        height: '100%',
        width: '100%'
    },
    shimmer: {
        ...StyleSheet.absoluteFillObject,
        width: 120
    }
});

const SHIMMER_WIDTH = 120;
const SHIMMER_DURATION = 1500;
const SHIMMER_DELAY = 200;
const SHIMMER_OFFSET = 100;
const ICON_ROTATION_DURATION = 2000;
const ICON_SCALE_DURATION = 800;
const ICON_SCALE_MAX = 1.15;
const FULL_ROTATION = 360;

const GRADIENT_COLORS = ['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent'] as const;
const GRADIENT_START = { x: 0, y: 0.5 };
const GRADIENT_END = { x: 1, y: 0.5 };

export const CategorySuggestionLoadingPill = () => {
    const { t } = useLingui();

    const shimmerPosition = useSharedValue(-SHIMMER_WIDTH);
    const iconRotation = useSharedValue(0);
    const iconScale = useSharedValue(1);

    useEffect(() => {
        shimmerPosition.value = withRepeat(
            withSequence(
                withTiming(-SHIMMER_WIDTH, { duration: 0 }),
                withDelay(
                    SHIMMER_DELAY,
                    withTiming(SHIMMER_WIDTH + SHIMMER_OFFSET, { duration: SHIMMER_DURATION, easing: Easing.inOut(Easing.ease) })
                )
            ),
            -1
        );

        iconRotation.value = withRepeat(withTiming(FULL_ROTATION, { duration: ICON_ROTATION_DURATION, easing: Easing.linear }), -1);

        iconScale.value = withRepeat(
            withSequence(withTiming(ICON_SCALE_MAX, { duration: ICON_SCALE_DURATION }), withTiming(1, { duration: ICON_SCALE_DURATION })),
            -1
        );
    }, [iconRotation, iconScale, shimmerPosition]);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shimmerPosition.value }]
    }));

    const iconAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${iconRotation.value}deg` }, { scale: iconScale.value }]
    }));

    const combinedShimmerStyle = useMemo(() => [styles.shimmer, shimmerStyle], [shimmerStyle]);

    return (
        <View className="flex-row items-center gap-sm px-md py-xs bg-surface-secondary rounded-full border border-outline-secondary overflow-hidden">
            <Animated.View style={iconAnimatedStyle}>
                <Icon icon={UserIconNameEnum.Sparkles} size={16} className="text-secondary-foreground" />
            </Animated.View>
            <Text className="text-xs text-secondary-foreground">{t`Thinking...`}</Text>
            <Animated.View style={combinedShimmerStyle}>
                <LinearGradient colors={GRADIENT_COLORS} start={GRADIENT_START} end={GRADIENT_END} style={styles.gradient} />
            </Animated.View>
        </View>
    );
};
