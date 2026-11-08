import { useLingui } from '@lingui/react/macro';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useUniwind } from 'uniwind';

import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly presence: SharedValue<number>;
    readonly onPress: () => void;
}

const SCRIM_OPACITY_LIGHT = 0.5;
const SCRIM_OPACITY_DARK = 0.8;

export const MorphScrim = ({ presence, onPress }: Props) => {
    const { t } = useLingui();
    const { theme } = useUniwind();
    const scrimOpacity = theme === 'dark' ? SCRIM_OPACITY_DARK : SCRIM_OPACITY_LIGHT;
    const scrimStyle = useAnimatedStyle(() => ({ opacity: presence.get() * scrimOpacity }));

    return (
        <Pressable className="absolute inset-0" accessibilityRole="button" accessibilityLabel={t`Close`} onPress={onPress}>
            <Animated.View className="flex-1 bg-black" style={scrimStyle} />
        </Pressable>
    );
};
