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
    readonly isCurrent: boolean;
    readonly onPress: () => void;
}

const PERCENT = 100;

const barVariants = cva('w-full max-w-[28px] rounded-t-[4px] rounded-b-[1px]', {
    variants: {
        tone: { selected: 'bg-chart-1', current: 'bg-chart-1/50', default: 'bg-secondary-foreground/70' }
    }
});

const labelVariants = cva('text-center text-xxs', {
    variants: { isSelected: { true: 'font-semibold text-primary', false: 'text-secondary-foreground' } }
});

export const StatisticsTrendBar = ({ label, accessibilityLabel, ratio, isSelected, isCurrent, onPress }: Props) => {
    const currentTone = isCurrent ? 'current' : 'default';
    const tone = isSelected ? 'selected' : currentTone;
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
                    <View className={barVariants({ tone })} style={barStyle} />
                ) : (
                    <View className="h-[2px] w-[12px] rounded-full bg-surface-separator" />
                )}
            </View>

            <Text numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className={labelVariants({ isSelected })}>
                {label}
            </Text>
        </HapticPressable>
    );
};
