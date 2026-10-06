import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';

interface Props {
    readonly count: number;
    readonly isSelected: boolean;
    readonly onSelect: (count: number) => void;
}

const chipVariants = cva('min-w-12 flex-1 items-center rounded-full px-lg py-md', {
    variants: {
        isSelected: {
            true: 'bg-primary',
            false: 'bg-secondary-background'
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

export const InstallmentCountChip = ({ count, isSelected, onSelect }: Props) => {
    const { t } = useLingui();
    const accessibilityState = { selected: isSelected, checked: isSelected };
    const accessibilityLabel = t({ message: plural(count, { one: '# payment', other: '# payments' }) });

    const handlePress = () => {
        onSelect(count);
    };

    return (
        <HapticPressable
            className={chipVariants({ isSelected })}
            onPress={handlePress}
            accessibilityRole="radio"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={accessibilityState}
            testID={ConvertToInstallmentModalSelector.CountChip(count)}
        >
            <Text className={labelVariants({ isSelected })}>{count}</Text>
        </HapticPressable>
    );
};
