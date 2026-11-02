import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

import type { SegmentedControlSegmentInterface } from '../../interface/segmented-control-segment.interface';

interface Props<T extends string> {
    readonly segment: SegmentedControlSegmentInterface<T>;
    readonly isActive: boolean;
    readonly disabled: boolean;
    readonly onPress: (value: T) => void;
}

const labelVariants = cva('text-[13px]', {
    variants: {
        isActive: { true: 'font-semibold', false: 'font-medium' },
        disabled: { true: 'text-secondary-foreground/50', false: 'text-primary' }
    }
});

export const SegmentedControlItem = <T extends string>({ segment, isActive, disabled, onPress }: Props<T>) => {
    const handlePress = () => void onPress(segment.value);

    const isSelected = isActive && !disabled;
    const accessibilityState = { selected: isSelected, disabled };

    return (
        <HapticPressable
            accessibilityRole="tab"
            accessibilityState={accessibilityState}
            className="flex-1 items-center justify-center px-md py-sm active:scale-100"
            hitSlop={0}
            disabled={disabled}
            testID={segment.testID}
            onPress={handlePress}
        >
            <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                className={labelVariants({ isActive: isSelected, disabled })}
            >
                {segment.label}
            </Text>
        </HapticPressable>
    );
};
