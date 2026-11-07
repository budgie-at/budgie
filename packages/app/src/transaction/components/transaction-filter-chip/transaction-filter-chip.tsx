import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { EmptyFn } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { HapticPressFeedbackEnum } from '../../../@generic/enum/haptic-press-feedback.enum';
import { FILTER_CHIP_CLASS_NAME } from '../../constant/filter-chip-class-name.constant';
import { FILTER_CHIP_HIT_SLOP } from '../../constant/filter-chip-hit-slop.constant';

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
    <HapticPressable
        className={chipVariants({ isActive })}
        hitSlop={FILTER_CHIP_HIT_SLOP}
        onPress={onPress}
        pressFeedback={HapticPressFeedbackEnum.SELECTION}
        testID={testID}
    >
        <Text maxFontSizeMultiplier={2} dynamicTypeRamp="body" className={textVariants({ isActive })}>
            {label}
        </Text>
    </HapticPressable>
);
