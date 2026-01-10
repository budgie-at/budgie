import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { BACKGROUND_COLOR_PALETTE } from '../../constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { useVibration } from '../../hook/use-vibration.hook';
import { Icon } from '../icon/icon';

import { useAnimatedActionMenu } from './animated-action-menu.context';

import type { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import type { UserIconNameEnum } from '@budgie/contracts';
import type { ClassValue } from 'clsx';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly variant: ColorPaletteVariant;
    readonly index: number;
    readonly totalItems: number;
    readonly onPress: () => void;
}

const ICON_SIZE = 20;
const ITEM_SPACING = 72;
const STAGGER_DELAY = 40;
const SPRING_CONFIG = { damping: 12, stiffness: 180, mass: 0.6 };

const containerVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>(
    'w-12 h-12 rounded-full items-center justify-center border-0',
    {
        variants: { variant: BACKGROUND_COLOR_PALETTE }
    }
);

const iconVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const AnimatedActionItem = ({ icon, label, variant, index, totalItems, onPress }: Props) => {
    const { isOpen, close } = useAnimatedActionMenu();
    const [, hapticImpact] = useVibration();

    const translateY = useSharedValue(0);
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    const reverseIndex = totalItems - 1 - index;
    const targetY = -(ITEM_SPACING * (index + 1));

    useEffect(() => {
        if (isOpen) {
            const delay = reverseIndex * STAGGER_DELAY;
            translateY.value = withDelay(delay, withSpring(targetY, SPRING_CONFIG));
            scale.value = withDelay(delay, withSpring(1, SPRING_CONFIG));
            opacity.value = withDelay(delay, withSpring(1, SPRING_CONFIG));
        } else {
            const delay = index * STAGGER_DELAY;
            translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIG));
            scale.value = withDelay(delay, withSpring(0, SPRING_CONFIG));
            opacity.value = withDelay(delay, withSpring(0, SPRING_CONFIG));
        }
    }, [index, isOpen, opacity, reverseIndex, scale, targetY, translateY]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }, { scale: scale.value }],
        opacity: opacity.value
    }));

    const handlePress = () => {
        hapticImpact(ImpactFeedbackStyle.Medium);
        runOnJS(close)();
        runOnJS(onPress)();
    };

    return (
        <Animated.View className="absolute right-0 flex-row-reverse items-center" style={animatedStyle}>
            <Pressable onPress={handlePress}>
                <View className={containerVariants({ variant })}>
                    <Icon className={iconVariants({ variant })} icon={icon} size={ICON_SIZE} />
                </View>
            </Pressable>

            <Text className="text-white text-sm font-medium mr-lg">{label}</Text>
        </Animated.View>
    );
};
