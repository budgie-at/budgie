import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { router } from 'expo-router';
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

import { useVibration } from '../../../hook/use-vibration.hook';
import { HapticPressable } from '../../haptic-pressable/haptic-pressable';
import { Icon } from '../../icon/icon';

interface Props {
    readonly onClose: () => void;
}

const BUTTON_SIZE = 72;
const ICON_SIZE = 32;
const PULSE_SCALE = 1.06;
const SPRING_CONFIG = { damping: 12, stiffness: 180, mass: 0.6 };

export const AiActionButton = ({ onClose }: Props) => {
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
        onClose();
        router.push('/(main)/ai');
    };

    const buttonStyle = { width: BUTTON_SIZE, height: BUTTON_SIZE };

    return (
        <Animated.View style={animatedStyle}>
            <HapticPressable
                className="bg-primary rounded-full items-center justify-center shadow-lg shadow-black/30"
                style={buttonStyle}
                onPress={handlePress}
            >
                <Icon className="text-primary-reverse" icon={UserIconNameEnum.Mic} size={ICON_SIZE} />
            </HapticPressable>
        </Animated.View>
    );
};
