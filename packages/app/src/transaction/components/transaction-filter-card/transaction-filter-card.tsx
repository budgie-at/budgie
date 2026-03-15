import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

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
    readonly selectedTestID?: string;
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

export const TransactionFilterCard = ({ isSelected, onPress, icon, label, variant, testID, selectedTestID }: Props) => {
    const iconVariant = isSelected ? variant : 'secondary';

    return (
        <HapticPressable onPress={onPress} className={cardVariants({ isSelected })} testID={testID}>
            <CircleIcon icon={icon} variant={iconVariant} />
            <Text className={textVariants({ isSelected })}>{label}</Text>
            {isSelected ? <View testID={selectedTestID} /> : null}
        </HapticPressable>
    );
};
