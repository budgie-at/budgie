import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { FILTER_CHIP_CLASS_NAME } from '../../constant/filter-chip-class-name.constant';

interface Props {
    readonly label: string;
    readonly icon: UserIconNameEnum;
    readonly onPress: EmptyFn;
    readonly isActive: boolean;
    readonly testID?: string;
}

const chipVariants = cva(FILTER_CHIP_CLASS_NAME, {
    variants: {
        isActive: {
            true: 'border-primary bg-primary',
            false: 'border-secondary-corner'
        }
    }
});

const textVariants = cva('text-[13px] font-medium', {
    variants: {
        isActive: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground'
        }
    }
});

export const TransactionFilterChip = ({ label, onPress, icon, isActive, testID }: Props) => (
    <HapticPressable className={chipVariants({ isActive })} onPress={onPress} testID={testID}>
        <Icon icon={icon} className={textVariants({ isActive })} size={13} />
        <Text className={textVariants({ isActive })}>{label}</Text>
    </HapticPressable>
);
