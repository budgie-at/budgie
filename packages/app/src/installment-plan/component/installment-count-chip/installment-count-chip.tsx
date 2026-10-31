import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Pressable, Text } from 'react-native';

import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { ConvertToInstallmentModalSelector } from '../../../app/convert-to-installment-modal.selector';

interface Props {
    readonly count: number;
    readonly isSelected: boolean;
    readonly minimumCount: number;
    readonly onSelect: (count: number) => void;
}

const chipVariants = cva('min-h-[44px] flex-1 items-center justify-center rounded-full px-lg', {
    variants: {
        isDisabled: {
            true: 'opacity-40',
            false: 'active:opacity-60'
        }
    }
});

const labelVariants = cva('text-md tabular-nums', {
    variants: {
        isSelected: {
            true: 'font-semibold text-primary',
            false: 'font-medium text-secondary-foreground'
        }
    }
});

export const InstallmentCountChip = ({ count, isSelected, minimumCount, onSelect }: Props) => {
    const { t } = useLingui();
    const [, , hapticSelection] = useVibration();
    const isDisabled = count < minimumCount;
    const accessibilityState = { checked: isSelected, disabled: isDisabled };
    const accessibilityLabel = t({ message: plural(count, { one: '# month', other: '# months' }) });

    const handlePress = () => {
        if (!isSelected) {
            hapticSelection();
        }

        onSelect(count);
    };

    return (
        <Pressable
            className={chipVariants({ isDisabled })}
            onPress={handlePress}
            disabled={isDisabled}
            hitSlop={4}
            accessibilityRole="radio"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={accessibilityState}
            testID={ConvertToInstallmentModalSelector.CountChip(count)}
        >
            <Text className={labelVariants({ isSelected })}>{count}</Text>
        </Pressable>
    );
};
