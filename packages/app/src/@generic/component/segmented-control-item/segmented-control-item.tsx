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
    readonly pressFeedback: HapticPressFeedbackEnum;
    readonly onPress: (value: T) => void;
}

const MINIMUM_LABEL_SCALE = 13 / 15;

const labelVariants = cva('text-[15px]', {
    variants: {
        isActive: { true: 'font-semibold', false: 'font-medium dark:opacity-70' },
        disabled: { true: 'text-secondary-foreground/50', false: 'text-primary' }
    }
});

export const SegmentedControlItem = <T extends string>(props: Props<T>) => {
    const { segment, isActive, disabled, onPress, pressFeedback, maxFontSizeMultiplier = MAX_FONT_SIZE_MULTIPLIER } = props;
    const handlePress = () => void onPress(segment.value);

    const isSelected = isActive && !disabled;
    const accessibilityState = { selected: isSelected, disabled };

    return (
        <HapticPressable
            pressedScale={1}
            pressFeedback={pressFeedback}
            accessibilityRole="tab"
            accessibilityState={accessibilityState}
            className="min-h-[44px] flex-1 items-center justify-center px-md py-sm"
            hitSlop={0}
            disabled={disabled}
            testID={segment.testID}
            onPress={handlePress}
        >
            <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={MINIMUM_LABEL_SCALE}
                maxFontSizeMultiplier={maxFontSizeMultiplier}
                className={labelVariants({ isActive: isSelected, disabled })}
            >
                {segment.label}
            </Text>
        </HapticPressable>
    );
};
