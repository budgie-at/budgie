import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { FILTER_CHIP_CLASS_NAME } from '../../constant/filter-chip-class-name.constant';

interface Props {
    readonly label: string;
    readonly onPress: EmptyFn;
    readonly isActive: boolean;
    readonly testID?: string;
}

const chipVariants = cva(FILTER_CHIP_CLASS_NAME, {
    variants: {
        isActive: {
            true: 'bg-primary',
            false: 'bg-surface-fill'
        }
    }
});

const textVariants = cva('text-[13px] font-medium', {
    variants: {
        isActive: {
            true: 'text-primary-reverse',
            false: 'text-primary'
        }
    }
});

export const TransactionFilterChip = ({ label, onPress, isActive, testID }: Props) => (
    <HapticPressable className={chipVariants({ isActive })} onPress={onPress} testID={testID}>
        <Text className={textVariants({ isActive })}>{label}</Text>
    </HapticPressable>
);
