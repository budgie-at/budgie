import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { Text, View } from 'react-native';

import { IconSelectorModalSelector } from '../../../app/icon-selector-modal.selector';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { typedObjectEntries } from '../../utils/typed-object-entries.util';
import { typedObjectFromEntries } from '../../utils/typed-object-from-entries.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly onSelect: (name: UserIconNameEnum) => void;
    readonly variant: ColorPaletteVariant;
    readonly name: UserIconNameEnum;
    readonly isSelected: boolean;
    readonly className?: string;
    readonly icon: UserIconNameEnum;
}

const selectorVariants = cva('flex-1 rounded-3xl py-3xl border-2 border-secondary-corner items-center gap-y-md', {
    variants: {
        isSelected: {
            true: 'bg-secondary-background border-secondary-corner',
            false: 'border-secondary-corner/50'
        }
    }
});

const iconVariant = cva<{ variant: Record<ColorPaletteVariant, ClassValue>; isSelected: Record<`true` | `false`, ClassValue> }>('', {
    variants: {
        variant: typedObjectFromEntries(typedObjectEntries(FOREGROUND_COLOR_PALETTE).map(([key]) => [key, ''])),
        isSelected: {
            true: '',
            false: 'text-primary'
        }
    },
    compoundVariants: [
        ...typedObjectEntries(FOREGROUND_COLOR_PALETTE).map(([key]) => ({
            className: FOREGROUND_COLOR_PALETTE.secondary,
            isSelected: false,
            variant: key
        })),
        ...typedObjectEntries(FOREGROUND_COLOR_PALETTE).map(([key, value]) => ({ isSelected: true, className: value, variant: key }))
    ],
    defaultVariants: {
        variant: 'default',
        isSelected: false
    }
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
        <HapticPressable
            testID={IconSelectorModalSelector.IconCard(name)}
            className={cn(selectorVariants({ isSelected }), className)}
            onPress={handleSelect}
        >
            <View className="p-md">
                <Icon className={iconVariant({ variant, isSelected })} icon={icon} />
            </View>

            <Text className={nameVariants({ isSelected })} ellipsizeMode="tail" numberOfLines={1}>
                {name}
            </Text>
        </HapticPressable>
    );
};
