import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { GrowColumn } from '../../../@generic/component/grow-column/grow-column';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/footnote-max-font-size-multiplier.constant';
import { STATISTICS_TREND_PLOT_HEIGHT } from '../../constant/statistics-trend-plot-height.constant';

interface Props {
    readonly label: string;
    readonly accessibilityLabel: string;
    readonly ratio: number;
    readonly isSelected: boolean;
    readonly isHighlighted: boolean;
    readonly staggerIndex: number;
    readonly onPress: () => void;
}

const PLOT_STYLE = { height: STATISTICS_TREND_PLOT_HEIGHT };

const barVariants = cva('w-full max-w-[28px] rounded-t-[4px] rounded-b-[1px]', {
    variants: {
        isHighlighted: { true: 'bg-chart-1', false: 'bg-secondary-foreground/35' }
    }
});

const labelVariants = cva('text-center text-xs', {
    variants: { isHighlighted: { true: 'font-semibold text-primary', false: 'text-secondary-foreground' } }
});

export const StatisticsTrendBar = ({ label, accessibilityLabel, ratio, isSelected, isHighlighted, staggerIndex, onPress }: Props) => {
    const selectedState = { selected: isSelected };

    return (
        <HapticPressable
            pressedScale={1}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={selectedState}
            className="min-h-[44px] flex-1 gap-y-xs active:opacity-70"
            hitSlop={0}
            onPress={onPress}
        >
            <View className="items-center justify-end" style={PLOT_STYLE}>
                {isPositiveNumber(ratio) ? (
                    <GrowColumn ratio={ratio} className={barVariants({ isHighlighted })} staggerIndex={staggerIndex} />
                ) : (
                    <View className="h-[2px] w-[12px] rounded-full bg-surface-separator" />
                )}
            </View>

            <Text numberOfLines={1} maxFontSizeMultiplier={FOOTNOTE_MAX_FONT_SIZE_MULTIPLIER} className={labelVariants({ isHighlighted })}>
                {label}
            </Text>
        </HapticPressable>
    );
};
