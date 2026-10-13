import { UserIconType } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { IconSelectorModalSelector } from '../../../app/icon-selector-modal.selector';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly onSelect: (icon: UserIconType) => void;
    readonly variant: ColorPaletteVariant;
    readonly label: string;
    readonly isSelected: boolean;
    readonly className?: string;
    readonly icon: UserIconType;
}

const selectorVariants = cva('flex-1 rounded-3xl py-3xl border-2 border-secondary-corner items-center gap-y-md', {
    variants: {
        isSelected: {
            true: 'bg-secondary-background border-secondary-corner',
            false: 'border-secondary-corner/50'
        }
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

export const IconSelectorCard = ({ className, isSelected, icon, label, onSelect, variant }: Props) => {
    const handleSelect = () => void onSelect(icon);
    const iconClassName = isSelected ? FOREGROUND_COLOR_PALETTE[variant] : FOREGROUND_COLOR_PALETTE.secondary;

    return (
        <HapticPressable
            testID={IconSelectorModalSelector.IconCard(icon)}
            className={cn(selectorVariants({ isSelected }), className)}
            onPress={handleSelect}
        >
            <View className="p-md">
                <Icon className={cn(iconClassName)} icon={icon} />
            </View>

            <Text className={nameVariants({ isSelected })} ellipsizeMode="tail" numberOfLines={1}>
                {label}
            </Text>
        </HapticPressable>
    );
};
