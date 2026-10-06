import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';

interface Props {
    readonly count: number;
    readonly isSelected: boolean;
    readonly minimumCount: number;
    readonly onSelect: (count: number) => void;
}

const chipVariants = cva('min-w-12 flex-1 items-center rounded-full px-lg py-md', {
    variants: {
        isSelected: {
            true: 'bg-primary',
            false: 'bg-secondary-background'
        },
        isDisabled: {
            true: 'opacity-40',
            false: ''
        }
    }
});

const labelVariants = cva('text-md font-semibold tabular-nums', {
    variants: {
        isSelected: {
            true: 'text-primary-reverse',
            false: 'text-primary'
        }
    }
});

export const InstallmentCountChip = ({ count, isSelected, minimumCount, onSelect }: Props) => {
    const { t } = useLingui();
    const isDisabled = count < minimumCount;
    const accessibilityState = { selected: isSelected, checked: isSelected, disabled: isDisabled };
    const accessibilityLabel = t({ message: plural(count, { one: '# payment', other: '# payments' }) });

    const handlePress = () => {
        onSelect(count);
    };

    return (
        <HapticPressable
            className={chipVariants({ isSelected, isDisabled })}
            onPress={handlePress}
            disabled={isDisabled}
            accessibilityRole="radio"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={accessibilityState}
            testID={ConvertToInstallmentModalSelector.CountChip(count)}
        >
            <Text className={labelVariants({ isSelected })}>{count}</Text>
        </HapticPressable>
    );
};
