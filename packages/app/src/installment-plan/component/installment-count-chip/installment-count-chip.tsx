import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';

interface Props {
    readonly count: number;
    readonly isSelected: boolean;
    readonly onSelect: (count: number) => void;
}

const chipVariants = cva('flex-1 items-center rounded-full border py-md', {
    variants: {
        isSelected: {
            true: 'border-primary bg-primary',
            false: 'border-secondary-corner'
        }
    }
});

const labelVariants = cva('text-sm font-semibold tabular-nums', {
    variants: {
        isSelected: {
            true: 'text-primary-reverse',
            false: 'text-primary'
        }
    }
});

export const InstallmentCountChip = ({ count, isSelected, onSelect }: Props) => {
    const accessibilityState = { selected: isSelected };

    const handlePress = () => {
        onSelect(count);
    };

    return (
        <HapticPressable
            className={chipVariants({ isSelected })}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityState={accessibilityState}
            testID={ConvertToInstallmentModalSelector.CountChip(count)}
        >
            <Text className={labelVariants({ isSelected })}>{count}</Text>
        </HapticPressable>
    );
};
