import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { HapticPressable } from '../haptic-pressable/haptic-pressable';

import type { LayoutChangeEvent } from 'react-native';

interface Props {
    readonly label: string;
    readonly title: string;
    readonly isActive: boolean;
    readonly onPress: () => void;
    readonly onLayout: (event: LayoutChangeEvent) => void;
}

const CHIP_HIT_SLOP = { top: 6, bottom: 6, left: 4, right: 4 };

const chipVariants = cva('h-[32px] justify-center rounded-full px-xl active:opacity-70', {
    variants: { isActive: { true: 'bg-primary', false: 'bg-surface-disc' } }
});

const labelVariants = cva('text-[13px] font-semibold', {
    variants: { isActive: { true: 'text-surface', false: 'text-secondary-foreground' } }
});

export const IconSelectorChip = ({ label, title, isActive, onPress, onLayout }: Props) => {
    const accessibilityState = { selected: isActive };

    return (
        <HapticPressable
            className={chipVariants({ isActive })}
            onPress={onPress}
            onLayout={onLayout}
            hitSlop={CHIP_HIT_SLOP}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={accessibilityState}
        >
            <Text className={labelVariants({ isActive })}>{label}</Text>
        </HapticPressable>
    );
};
