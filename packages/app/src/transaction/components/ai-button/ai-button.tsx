import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { useEffect } from 'react';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';

interface Props {
    readonly onPress: () => void;
}

const ICON_SIZE = 32;
const PULSE_SCALE = 1.06;
const SPRING_CONFIG = { damping: 12, stiffness: 180, mass: 0.6 };

export const AiButton = ({ onPress }: Props) => {
    const [, hapticImpact] = useVibration();

    const scale = useSharedValue(0.01);
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        scale.value = withSpring(1, SPRING_CONFIG);
        pulseScale.value = withRepeat(
            withSequence(
                withTiming(PULSE_SCALE, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, [pulseScale, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value * pulseScale.value }]
    }));

    const handlePress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        onPress();
    };

    return (
        <Animated.View style={animatedStyle}>
            <HapticPressable
                className="bg-primary rounded-full items-center justify-center shadow-lg shadow-black/30 w-18 h-18"
                onPress={handlePress}
            >
                <Icon className="text-primary-reverse" icon={UserIconNameEnum.Mic} size={ICON_SIZE} />
            </HapticPressable>
        </Animated.View>
    );
};
