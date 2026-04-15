import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { BACKGROUND_COLOR_PALETTE } from '../../constant/background-color-palette.constant';
import { CardSizeType } from '../../type/card-size-type.type';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

import type { OnEventFn } from '@rnw-community/shared';
import type { PropsWithChildren } from 'react';

interface Props {
    readonly className?: string;
    readonly size?: CardSizeType;
    readonly onPress?: OnEventFn;
    readonly onLongPress?: OnEventFn;
    readonly variant?: ColorPaletteVariant;
    readonly testID?: string;
}

const cardVariants = cva<{ size: Record<CardSizeType, ClassValue>; variant: Record<ColorPaletteVariant, ClassValue> }>(
    'border rounded-5xl',
    {
        variants: {
            size: {
                sm: 'p-xl',
                md: 'p-3xl',
                lg: 'p-5xl'
            },
            variant: BACKGROUND_COLOR_PALETTE
        }
    }
);

export const Card = ({ className, onPress, onLongPress, variant = 'primary', size = 'lg', ...rest }: PropsWithChildren<Props>) => {
    const Component = isDefined(onPress) || isDefined(onLongPress) ? HapticPressable : View;

    return <Component className={cn(cardVariants({ size, variant }), className)} onPress={onPress} onLongPress={onLongPress} {...rest} />;
};
