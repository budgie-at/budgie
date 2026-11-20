import { YieldGroupEnum } from '@budgie/market';
import { cva } from 'class-variance-authority';
import { Text, View, useWindowDimensions } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { YIELD_GROUP_COLOR } from '../../constant/yield-group-color.constant';

import type { YieldGroupEnum as YieldGroupType } from '@budgie/market';

interface Props {
    readonly group: YieldGroupType;
    readonly label: string;
    readonly amount: string;
    readonly amountClassName: string;
    readonly share?: string | null;
    readonly isMuted?: boolean;
    readonly isEmpty?: boolean;
}

const LEGEND_MAX_FONT_SIZE_MULTIPLIER = 1.6;
const LABEL_LINE_HEIGHT = 20;
const DOT_SIZE = 10;
const HALF = 2;

const labelVariants = cva('flex-1 shrink text-sm leading-[20px]', {
    variants: {
        isEmpty: { true: 'text-secondary-foreground', false: 'text-primary' },
        isMuted: { true: 'text-secondary-foreground', false: '' }
    }
});
const amountsVariants = cva('shrink-0 flex-row items-baseline justify-end gap-x-xs', {
    variants: { isAccessibilityText: { true: 'self-end', false: '' } }
});

export const YieldLegendEntry = ({ group, label, amount, amountClassName, share, isMuted = false, isEmpty = false }: Props) => {
    const isIncreaseContrast = useIsIncreaseContrast();
    const isAccessibilityText = useIsAccessibilityTextSize();
    const { fontScale } = useWindowDimensions();

    const isTax = group === YieldGroupEnum.TAX;
    const dotClassName = cn(
        isTax ? 'bg-secondary-foreground/45' : YIELD_GROUP_COLOR[group][isIncreaseContrast ? 'backgroundContrast' : 'background'],
        isMuted && 'opacity-50',
        isEmpty && 'opacity-40'
    );
    const labelClassName = labelVariants({ isEmpty, isMuted });
    const amountsClassName = amountsVariants({ isAccessibilityText });
    const shapeClassName = isTax ? 'rounded-[2px]' : 'rounded-full';
    const dotStyle = isAccessibilityText ? { marginTop: Math.max((LABEL_LINE_HEIGHT * fontScale - DOT_SIZE) / HALF, 0) } : null;
    const dot = (
        <View className="w-[12px] items-center" style={dotStyle}>
            <View className={cn('h-[10px] w-[10px]', shapeClassName, dotClassName)} />
        </View>
    );
    const amounts = (
        <View className={amountsClassName}>
            {isNotEmptyString(share) ? (
                <Text
                    numberOfLines={1}
                    className="text-right text-sm tabular-nums text-secondary-foreground"
                    maxFontSizeMultiplier={LEGEND_MAX_FONT_SIZE_MULTIPLIER}
                >
                    {share} ·
                </Text>
            ) : null}
            <Text
                numberOfLines={1}
                className={cn('text-right', amountClassName, isEmpty && 'text-secondary-foreground')}
                maxFontSizeMultiplier={LEGEND_MAX_FONT_SIZE_MULTIPLIER}
            >
                {amount}
            </Text>
        </View>
    );

    if (isAccessibilityText) {
        return (
            <View className="flex-1 gap-y-xs">
                <View className="flex-row items-start gap-x-[8px]">
                    {dot}
                    <Text className={labelClassName} maxFontSizeMultiplier={LEGEND_MAX_FONT_SIZE_MULTIPLIER}>
                        {label}
                    </Text>
                </View>
                {amounts}
            </View>
        );
    }

    return (
        <>
            {dot}
            <Text className={labelClassName} maxFontSizeMultiplier={LEGEND_MAX_FONT_SIZE_MULTIPLIER}>
                {label}
            </Text>
            {amounts}
        </>
    );
};
