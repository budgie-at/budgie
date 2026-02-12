import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { useEffect } from 'react';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { BACKGROUND_COLOR_PALETTE } from '../../constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly isNegative: boolean;
    readonly variant: ColorPaletteVariant;
    readonly onToggle: () => void;
}

const FLIP_DURATION = 250;
const FLIP_HALFWAY = 0.5;
const FLIP_END_DEGREES = 180;
const ICON_SIZE = 20;
const PERSPECTIVE = 400;
const SIGN_TOGGLE_HIT_SLOP = { top: 16, bottom: 16, left: 12, right: 12 };

const pillVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>(
    'items-center justify-center rounded-full border w-10 h-10',
    {
        variants: {
            variant: BACKGROUND_COLOR_PALETTE
        }
    }
);

const iconVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

const timingConfig = { duration: FLIP_DURATION, easing: Easing.out(Easing.cubic) };
const mirroredTransform = [{ rotateY: `${FLIP_END_DEGREES}deg` }];

export const SignTogglePill = ({ isNegative, variant, onToggle }: Props) => {
    const flipProgress = useSharedValue(isNegative ? 1 : 0);

    useEffect(() => {
        flipProgress.set(withTiming(isNegative ? 1 : 0, timingConfig));
    }, [isNegative, flipProgress]);

    const flipStyle = useAnimatedStyle(() => ({
        transform: [{ perspective: PERSPECTIVE }, { rotateY: `${interpolate(flipProgress.value, [0, 1], [0, FLIP_END_DEGREES])}deg` }]
    }));

    const plusIconStyle = useAnimatedStyle(() => ({
        opacity: flipProgress.value < FLIP_HALFWAY ? 1 : 0
    }));

    const minusIconStyle = useAnimatedStyle(() => ({
        opacity: flipProgress.value >= FLIP_HALFWAY ? 1 : 0,
        transform: mirroredTransform
    }));

    return (
        <HapticPressable className={pillVariants({ variant })} hitSlop={SIGN_TOGGLE_HIT_SLOP} onPress={onToggle}>
            <Animated.View style={flipStyle}>
                <Animated.View style={plusIconStyle}>
                    <Icon icon={UserIconNameEnum.Plus} size={ICON_SIZE} className={iconVariants({ variant })} />
                </Animated.View>
                <Animated.View className="absolute" style={minusIconStyle}>
                    <Icon icon={UserIconNameEnum.Minus} size={ICON_SIZE} className={iconVariants({ variant })} />
                </Animated.View>
            </Animated.View>
        </HapticPressable>
    );
};
