import { UserIconNameEnum } from '@budgie/contracts';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
    FadeIn,
    interpolate,
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly onPress: () => void;
    readonly triggerTestID?: string;
    readonly iconTestID?: string;
}

const BOUNCE_SCALE = 1.08;
const BOUNCE_SPRING = { damping: 12, mass: 0.8, stiffness: 200 };
const RETURN_SPRING = { damping: 15, mass: 1, stiffness: 150 };
const PRESSED_SCALE = 0.92;
const RING_SCALE_START = 0.9;
const ICON_SIZE = 88;
const INNER_ICON_SIZE = 40;
const ICON_RADIUS = 28;
const RING_SIZE = 104;
const RING_BORDER_RADIUS = 34;
const RING_STYLE = { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_BORDER_RADIUS };
const PRESS_IN_DURATION = 150;
const PRESS_OUT_DURATION = 200;
const INTERPOLATE_RANGE: [number, number] = [0, 1];
const RING_COLOR_TRANSPARENT = 'transparent';
const RING_COLOR_ACTIVE = 'rgba(99, 102, 241, 0.3)';

export const CategoryIconDisplay = ({ icon, onPress, triggerTestID, iconTestID }: Props) => {
    const scale = useSharedValue(1);
    const pressed = useSharedValue(0);
    const previousIcon = useRef(icon);

    useEffect(() => {
        if (icon !== previousIcon.current) {
            scale.set(
                withSpring(BOUNCE_SCALE, BOUNCE_SPRING, finished => {
                    if (finished) {
                        scale.set(withSpring(1, RETURN_SPRING));
                    }
                })
            );
            previousIcon.current = icon;
        }
    }, [icon, scale]);

    const animatedStyle = useAnimatedStyle(() => {
        const pressedScale = interpolate(pressed.value, INTERPOLATE_RANGE, [1, PRESSED_SCALE]);

        return {
            transform: [{ scale: scale.value * pressedScale }]
        };
    });

    const ringStyle = useAnimatedStyle(() => ({
        opacity: pressed.value,
        transform: [{ scale: interpolate(pressed.value, INTERPOLATE_RANGE, [RING_SCALE_START, 1]) }],
        borderColor: interpolateColor(pressed.value, INTERPOLATE_RANGE, [RING_COLOR_TRANSPARENT, RING_COLOR_ACTIVE])
    }));

    const combinedRingStyle = [RING_STYLE, ringStyle];

    const handlePressIn = () => {
        pressed.set(withTiming(1, { duration: PRESS_IN_DURATION }));
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handlePressOut = () => {
        pressed.set(withTiming(0, { duration: PRESS_OUT_DURATION }));
    };

    const handlePress = () => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <Animated.View entering={FadeIn.duration(200)} className="items-center justify-center py-2xl">
            <Pressable testID={triggerTestID} onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                <View className="items-center justify-center">
                    <Animated.View className="absolute border-2 bg-transparent" style={combinedRingStyle} />
                    <Animated.View style={animatedStyle}>
                        <View testID={iconTestID}>
                            <CircleIcon icon={icon} variant="default" size={ICON_SIZE} iconSize={INNER_ICON_SIZE} radius={ICON_RADIUS} />
                        </View>
                    </Animated.View>
                </View>
            </Pressable>
        </Animated.View>
    );
};
