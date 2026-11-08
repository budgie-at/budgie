import { Pressable } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly translateY: SharedValue<number>;
    readonly visibleHeight: SharedValue<number>;
    readonly hiddenInset: number;
    readonly onPress: () => void;
}

const SCRIM_OPACITY_LIGHT = 0.5;
const SCRIM_OPACITY_DARK = 0.8;

export const MorphingSheetScrim = ({ translateY, visibleHeight, hiddenInset, onPress }: Props) => {
    const { theme } = useUniwind();
    const scrimOpacity = theme === 'dark' ? SCRIM_OPACITY_DARK : SCRIM_OPACITY_LIGHT;
    const scrimStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translateY.get(), [0, Math.max(visibleHeight.get() + hiddenInset, 1)], [scrimOpacity, 0], Extrapolation.CLAMP)
    }));

    return (
        <Pressable className="absolute inset-0" accessible={false} onPress={onPress}>
            <Animated.View className="flex-1 bg-black" style={scrimStyle} />
        </Pressable>
    );
};
