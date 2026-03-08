import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly label: string;
    readonly icon: UserIconNameEnum;
    readonly onPress: EmptyFn;
    readonly isActive: boolean;
    readonly testID?: string;
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

export const TransactionFilterChip = ({ label, onPress, icon, isActive, testID }: Props) => (
    <HapticPressable className={chipVariants({ isActive })} onPress={onPress} testID={testID}>
        <Icon icon={icon} className={textVariants({ isActive })} size={14} />
        <Text className={textVariants({ isActive })}>{label}</Text>
    </HapticPressable>
);
