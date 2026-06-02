import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly variant: ColorPaletteVariant;
    readonly isSelected: boolean;
    readonly onPress: EmptyFn;
    readonly icon: UserIconNameEnum;
    readonly label: string;
    readonly testID?: string;
}

const cardVariants = cva('h-full items-center justify-center gap-y-lg rounded-3xl border px-md', {
    variants: {
        isSelected: {
            true: 'border-primary/60 bg-primary',
            false: 'border-secondary-corner bg-transparent'
        }
    }
});

const textVariants = cva('text-center text-md font-medium leading-tight', {
    variants: {
        isSelected: {
            true: 'text-primary-reverse',
            false: 'text-primary'
        }
    }
});

export const TransactionFilterCard = ({ isSelected, onPress, icon, label, variant, testID }: Props) => {
    const iconVariant = isSelected ? variant : 'secondary';

    return (
        <HapticPressable onPress={onPress} className={cardVariants({ isSelected })} testID={testID}>
            <CircleIcon icon={icon} variant={iconVariant} size={44} iconSize={22} />
            <Text className={textVariants({ isSelected })} numberOfLines={2}>
                {label}
            </Text>
        </HapticPressable>
    );
};
