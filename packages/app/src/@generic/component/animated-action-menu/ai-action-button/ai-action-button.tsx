import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { router } from 'expo-router';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { useVibration } from '../../../hook/use-vibration.hook';
import { HapticPressable } from '../../haptic-pressable/haptic-pressable';
import { Icon } from '../../icon/icon';

interface Props {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly totalItems: number;
}

const BUTTON_SIZE = 52;
const ICON_SIZE = 24;
const ITEM_SPACING = 72;
const SPRING_CONFIG = { damping: 14, stiffness: 160, mass: 0.6 };
const AI_DELAY = 60;

export const AiActionButton = ({ isOpen, onClose, totalItems }: Props) => {
    const [, hapticImpact] = useVibration();

    const translateY = useSharedValue(0);
    const scale = useSharedValue(0);
    const rotation = useSharedValue(0);

    const targetY = -(ITEM_SPACING * (totalItems + 1));

    useEffect(() => {
        if (isOpen) {
            const delay = AI_DELAY;
            translateY.value = withDelay(delay, withSpring(targetY, SPRING_CONFIG));
            scale.value = withDelay(delay, withSpring(1, SPRING_CONFIG));
            rotation.value = withDelay(delay, withSpring(360, { ...SPRING_CONFIG, stiffness: 120 }));
        } else {
            translateY.value = withSpring(0, SPRING_CONFIG);
            scale.value = withSpring(0, SPRING_CONFIG);
            rotation.value = withSpring(0, SPRING_CONFIG);
        }
    }, [isOpen, rotation, scale, targetY, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }, { scale: scale.value }, { rotate: `${rotation.value}deg` }]
    }));

    const handlePress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        onClose();
        router.push('/(main)/ai');
    };

    const buttonStyle = { width: BUTTON_SIZE, height: BUTTON_SIZE };

    return (
        <Animated.View className="absolute right-0" style={animatedStyle}>
            <HapticPressable
                className="bg-tertiary rounded-full items-center justify-center shadow-lg shadow-black/30"
                style={buttonStyle}
                onPress={handlePress}
            >
                <Icon className="text-tertiary-reverse" icon={UserIconNameEnum.Mic} size={ICON_SIZE} />
            </HapticPressable>
        </Animated.View>
    );
};
