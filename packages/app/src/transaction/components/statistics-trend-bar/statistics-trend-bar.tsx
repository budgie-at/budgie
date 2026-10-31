import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';

interface Props {
    readonly label: string;
    readonly accessibilityLabel: string;
    readonly ratio: number;
    readonly isSelected: boolean;
    readonly isHighlighted: boolean;
    readonly onPress: () => void;
}

const PERCENT = 100;

const barVariants = cva('w-full max-w-[28px] rounded-t-[4px] rounded-b-[1px]', {
    variants: {
        isHighlighted: { true: 'bg-chart-1', false: 'bg-secondary-foreground/35' }
    }
});

const labelVariants = cva('text-center text-xxs', {
    variants: { isHighlighted: { true: 'font-semibold text-primary', false: 'text-secondary-foreground' } }
});

export const StatisticsTrendBar = ({ label, accessibilityLabel, ratio, isSelected, isHighlighted, onPress }: Props) => {
    const selectedState = { selected: isSelected };
    const barStyle = { height: `${ratio * PERCENT}%` as const };

    return (
        <HapticPressable
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={selectedState}
            className="min-h-[44px] flex-1 gap-y-xs active:scale-100 active:opacity-70"
            hitSlop={0}
            onPress={onPress}
        >
            <View className="h-[72px] items-center justify-end">
                {isPositiveNumber(ratio) ? (
                    <View className={barVariants({ isHighlighted })} style={barStyle} />
                ) : (
                    <View className="h-[2px] w-[12px] rounded-full bg-surface-separator" />
                )}
            </View>

            <Text numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className={labelVariants({ isHighlighted })}>
                {label}
            </Text>
        </HapticPressable>
    );
};
