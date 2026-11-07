import { cva } from 'class-variance-authority';
import { Text } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { HapticPressFeedbackEnum } from '../../enum/haptic-press-feedback.enum';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';

import type { SegmentedControlSegmentInterface } from '../../interface/segmented-control-segment.interface';

interface Props<T extends string> {
    readonly segment: SegmentedControlSegmentInterface<T>;
    readonly isActive: boolean;
    readonly disabled: boolean;
    readonly maxFontSizeMultiplier?: number;
    readonly onPress: (value: T) => void;
}

const SEGMENT_HIT_SLOP = { top: 6, bottom: 6 } as const;

const labelVariants = cva('text-[15px]', {
    variants: {
        isActive: { true: 'font-semibold', false: 'font-medium dark:opacity-70' },
        disabled: { true: 'text-secondary-foreground/50', false: 'text-primary' }
    }
});

export const SegmentedControlItem = <T extends string>(props: Props<T>) => {
    const { segment, isActive, disabled, onPress, maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER } = props;
    const handlePress = () => void onPress(segment.value);

    const isSelected = isActive && !disabled;
    const accessibilityState = { selected: isSelected, disabled };

    return (
        <HapticPressable
            pressedScale={1}
            pressFeedback={HapticPressFeedbackEnum.SELECTION}
            accessibilityRole="tab"
            accessibilityState={accessibilityState}
            className="flex-1 items-center justify-center px-md py-sm"
            hitSlop={SEGMENT_HIT_SLOP}
            disabled={disabled}
            testID={segment.testID}
            onPress={handlePress}
        >
            <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                maxFontSizeMultiplier={maxFontSizeMultiplier}
                className={labelVariants({ isActive: isSelected, disabled })}
            >
                {segment.label}
            </Text>
        </HapticPressable>
    );
};
