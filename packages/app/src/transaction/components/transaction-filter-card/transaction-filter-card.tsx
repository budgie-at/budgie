import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { IconName } from '../../../@generic/constant/icons.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly isSelected: boolean;
    readonly onPress: EmptyFn;
    readonly icon: IconName;
    readonly label: string;
}

const cardVariants = cva('flex-row items-center gap-x-md border-2 rounded-5xl p-4xl', {
    variants: {
        isSelected: {
            true: 'border-secondary-corner bg-secondary-background',
            false: 'border-secondary-corner/50'
        }
    }
});

const textVariants = cva('text-sm font-medium', {
    variants: {
        isSelected: {
            true: 'text-primary',
            false: 'text-secondary-foreground'
        }
    }
});

export const TransactionFilterCard = ({ isSelected, onPress, icon, label, variant }: Props) => {
    const iconVariant = isSelected ? variant : 'secondary';

    return (
        <HapticPressable onPress={onPress} className={cardVariants({ isSelected })}>
            <CircleIcon icon={icon} variant={iconVariant} />
            <Text className={textVariants({ isSelected })}>{label}</Text>
        </HapticPressable>
    );
};
