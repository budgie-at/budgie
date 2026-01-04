import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { ComponentProps } from 'react';
import { View } from 'react-native';

import { BACKGROUND_COLOR_PALETTE } from '../../constant/background-color-palette.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { BottomSheetTextInput } from '../bottom-sheet-text-input/bottom-sheet-text-input';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface RightActionProps {
    readonly icon: UserIconNameEnum;
    readonly onPress: () => void;
    readonly variant?: ColorPaletteVariant;
}

interface Props extends ComponentProps<typeof BottomSheetTextInput> {
    readonly inputClassName?: string;
    readonly rightAction?: RightActionProps;
}

const actionButtonVariants = cva<{
    variant: Record<ColorPaletteVariant, ClassValue>;
}>('h-[44px] w-[44px] items-center justify-center rounded-full', {
    variants: {
        variant: BACKGROUND_COLOR_PALETTE
    },
    defaultVariants: {
        variant: 'primary'
    }
});

const actionIconVariants = cva<{
    variant: Record<ColorPaletteVariant, ClassValue>;
}>('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    },
    defaultVariants: {
        variant: 'primary'
    }
});

export const BottomSheetSearch = ({ className, inputClassName, rightAction, ...rest }: Props) => (
    <View className={cn('py-3xl px-xl border-t border-t-secondary-corner border-b border-b-secondary-corner', className)}>
        <View className="flex-row items-center gap-x-md">
            <BottomSheetTextInput
                className={cn(
                    'flex-1 rounded-5xl bg-secondary-background h-[44px] px-xl border border-secondary-corner placeholder-secondary-reverse-foreground text-primary',
                    inputClassName
                )}
                {...rest}
            />
            {rightAction && (
                <HapticPressable onPress={rightAction.onPress} className={actionButtonVariants({ variant: rightAction.variant })}>
                    <Icon icon={rightAction.icon} size={20} className={actionIconVariants({ variant: rightAction.variant })} />
                </HapticPressable>
            )}
        </View>
    </View>
);
