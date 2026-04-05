import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly title: string;
    readonly isSelected: boolean;
    readonly onSelect: () => void;
}

const chipVariants = cva('flex-row items-center gap-x-sm rounded-full px-lg py-md border', {
    variants: {
        isSelected: {
            true: 'border-primary bg-primary/10',
            false: 'border-secondary-corner bg-secondary-background'
        }
    }
});

const titleVariants = cva('font-medium text-sm', {
    variants: {
        isSelected: {
            true: 'text-primary',
            false: 'text-primary'
        }
    }
});

export const ImportPresetChip = ({ title, isSelected, onSelect }: Props) => (
    <HapticPressable className={chipVariants({ isSelected })} onPress={onSelect}>
        <Text className={titleVariants({ isSelected })}>{title}</Text>
        {isSelected && <Icon icon={UserIconNameEnum.Check} size={12} className="text-primary" />}
    </HapticPressable>
);
