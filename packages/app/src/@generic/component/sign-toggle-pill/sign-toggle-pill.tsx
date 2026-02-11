import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

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

const ANIMATION_DURATION = 150;

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

const enteringAnimation = FadeIn.duration(ANIMATION_DURATION);
const exitingAnimation = FadeOut.duration(ANIMATION_DURATION);

export const SignTogglePill = ({ isNegative, variant, onToggle }: Props) => {
    const icon = isNegative ? UserIconNameEnum.Minus : UserIconNameEnum.Plus;

    return (
        <HapticPressable className={pillVariants({ variant })} onPress={onToggle}>
            <Animated.View key={icon} entering={enteringAnimation} exiting={exitingAnimation}>
                <Icon icon={icon} size={20} className={iconVariants({ variant })} />
            </Animated.View>
        </HapticPressable>
    );
};
