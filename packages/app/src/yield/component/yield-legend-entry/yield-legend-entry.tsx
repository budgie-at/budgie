import { YieldGroupEnum } from '@budgie/market';
import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useYieldGroupColor } from '../../hook/use-yield-group-color.hook';

interface Props {
    readonly group: YieldGroupEnum;
    readonly label: string;
    readonly amount: string;
    readonly share?: string | null;
    readonly isMuted?: boolean;
    readonly isEmpty?: boolean;
}

const LEGEND_MAX_FONT_SIZE_MULTIPLIER = 1.6;
const AMOUNT_CLASSNAME = 'text-right text-sm font-semibold tabular-nums text-primary';
const MUTED_AMOUNT_CLASSNAME = 'text-right text-sm tabular-nums text-secondary-foreground';

const labelVariants = cva('flex-1 shrink text-sm leading-[20px]', {
    variants: {
        isEmpty: { true: 'text-secondary-foreground', false: 'text-primary' },
        isMuted: { true: 'text-secondary-foreground', false: '' }
    }
});
const amountsVariants = cva('shrink-0 flex-row items-baseline justify-end gap-x-xs', {
    variants: { isAccessibilityText: { true: 'ml-[20px] self-start', false: '' } }
});

export const YieldLegendEntry = ({ group, label, amount, share, isMuted = false, isEmpty = false }: Props) => {
    const { background } = useYieldGroupColor(group);
    const isAccessibilityText = useIsAccessibilityTextSize();

    const isTax = group === YieldGroupEnum.TAX;
    const dotClassName = cn(isTax ? 'bg-secondary-foreground/70' : background, isMuted && 'opacity-60', isEmpty && 'opacity-40');
    const amountClassName = isMuted ? MUTED_AMOUNT_CLASSNAME : AMOUNT_CLASSNAME;
    const labelClassName = labelVariants({ isEmpty, isMuted });
    const amountsClassName = amountsVariants({ isAccessibilityText });
    const shapeClassName = isTax ? 'rounded-[2px]' : 'rounded-full';
    const dot = (
        <View className="w-[12px] items-center">
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
                className={cn(amountClassName, isEmpty && 'text-secondary-foreground')}
                maxFontSizeMultiplier={LEGEND_MAX_FONT_SIZE_MULTIPLIER}
            >
                {amount}
            </Text>
        </View>
    );

    if (isAccessibilityText) {
        return (
            <View className="flex-1 gap-y-xs">
                <View className="flex-row items-center gap-x-[8px]">
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
