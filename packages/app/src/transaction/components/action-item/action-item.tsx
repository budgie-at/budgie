import { cva } from 'class-variance-authority';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';
import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { CreateTransactionMenuSelector } from '../create-transaction-menu/create-transaction-menu.selector';

import type { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import type { UserIconNameEnum } from '@budgie/contracts';
import type { ClassValue } from 'clsx';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID?: string;
    readonly variant: ColorPaletteVariant;
    readonly index: number;
    readonly totalItems: number;
    readonly isOpen: boolean;
    readonly onPress: () => void;
}

const ICON_SIZE = 20;
const ITEM_SPACING = 72;
const STAGGER_DELAY = 40;
const SPRING_CONFIG = { damping: 12, stiffness: 180, mass: 0.6 };

const containerVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>(
    'w-12 h-12 rounded-full items-center justify-center border-0',
    { variants: { variant: BACKGROUND_COLOR_PALETTE } }
);

const iconVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const ActionItem = ({ icon, label, testID, variant, index, totalItems, isOpen, onPress }: Props) => {
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
        onPress();
    };

    return (
        <Animated.View className="absolute right-0" style={animatedStyle}>
            <Pressable
                className="flex-row-reverse items-center"
                onPress={handlePress}
                testID={testID ?? CreateTransactionMenuSelector.item(index)}
            >
                <View className={containerVariants({ variant })}>
                    <Icon className={iconVariants({ variant })} icon={icon} size={ICON_SIZE} />
                </View>
                <Text className="text-white text-sm font-medium mr-lg">{label}</Text>
            </Pressable>
        </Animated.View>
    );
};
