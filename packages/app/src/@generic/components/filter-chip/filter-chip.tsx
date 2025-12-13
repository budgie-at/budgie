import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { ICONS, IconName } from '../../constant/icons.constant';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

interface Props {
    readonly label: string;
    readonly icon: IconName;
    readonly onPress: EmptyFn;
    readonly isActive: boolean;
}

const chipVariants = cva('rounded-2xl border px-xl flex-row items-center gap-x-sm py-sm', {
    variants: {
        isActive: {
            true: 'border-primary bg-primary',
            false: 'border-secondary-corner'
        }
    }
});

const textVariants = cva('text-sm', {
    variants: {
        isActive: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground'
        }
    }
});

export const FilterChip = ({ label, onPress, icon, isActive }: Props) => (
    <HapticPressable className={chipVariants({ isActive })} onPress={onPress}>
        <Icon icon={ICONS[icon]} className={textVariants({ isActive })} size={14} />
        <Text className={textVariants({ isActive })}>{label}</Text>
    </HapticPressable>
);
