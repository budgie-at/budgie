import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { BACKGROUND_COLOR_PALETTE } from '../../constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { useVibration } from '../../hook/use-vibration.hook';
import { Icon } from '../icon/icon';

import type { RadialActionItemInterface } from './radial-action-item.interface';
import type { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import type { ClassValue } from 'clsx';

interface Props {
    readonly item: RadialActionItemInterface;
    readonly index: number;
    readonly totalItems: number;
    readonly isOpen: boolean;
    readonly onClose: () => void;
}

const ITEM_SIZE = 48;
const ICON_SIZE = 20;
const ITEM_SPACING = 72;
const STAGGER_DELAY = 40;
const SPRING_CONFIG = { damping: 12, stiffness: 180, mass: 0.6 };

const containerVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('rounded-full items-center justify-center border-0', {
    variants: { variant: BACKGROUND_COLOR_PALETTE }
});

const iconVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const RadialActionItem = ({ item, index, totalItems, isOpen, onClose }: Props) => {
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
        runOnJS(onClose)();
        runOnJS(item.onPress)();
    };

    const containerStyle = { width: ITEM_SIZE, height: ITEM_SIZE };

    return (
        <Animated.View className="absolute right-0 flex-row-reverse items-center" style={animatedStyle}>
            <Pressable onPress={handlePress}>
                <View className={containerVariants({ variant: item.variant })} style={containerStyle}>
                    <Icon className={iconVariants({ variant: item.variant })} icon={item.icon} size={ICON_SIZE} />
                </View>
            </Pressable>

            <Text className="text-white text-sm font-medium mr-lg">{item.label}</Text>
        </Animated.View>
    );
};
