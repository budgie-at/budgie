import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { Text, View } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import type { IconName } from '../../constant/icons.constant';

interface Props {
    readonly onSelect: (name: UserIconNameEnum) => void;
    readonly variant: ColorPaletteVariant;
    readonly name: UserIconNameEnum;
    readonly isSelected: boolean;
    readonly className?: string;
    readonly icon: IconName;
}

const selectorVariants = cva('flex-1 rounded-3xl py-3xl border-2 border-secondary-corner items-center gap-y-md', {
    variants: {
        isSelected: {
            true: 'bg-secondary-background border-secondary-corner',
            false: 'border-secondary-corner/50'
        }
    }
});

const iconVariant = cva<{ variant: Record<ColorPaletteVariant, ClassValue>; isSelected: Record<'false', ClassValue> }>('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE,
        isSelected: { false: 'text-primary' }
    },
    compoundVariants: [
        {
            isSelected: true,
            variant: 'default',
            className: FOREGROUND_COLOR_PALETTE.default
        },
        {
            isSelected: true,
            variant: 'positive',
            className: FOREGROUND_COLOR_PALETTE.positive
        }
    ]
});

const nameVariants = cva('font-medium text-xxs px-lg', {
    variants: {
        isSelected: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    }
});

export const IconSelectorCard = ({ className, isSelected, icon, name, onSelect, variant }: Props) => {
    const handleSelect = () => void onSelect(name);

    return (
        <HapticPressable className={cn(selectorVariants({ isSelected }), className)} onPress={handleSelect}>
            <View className="p-md">
                <Icon className={iconVariant({ variant, isSelected })} icon={icon} />
            </View>

            <Text className={nameVariants({ isSelected })} ellipsizeMode="tail" numberOfLines={1}>
                {name}
            </Text>
        </HapticPressable>
    );
};
