import { cva } from 'class-variance-authority';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { useIsIncreaseContrast } from '../../../@generic/hook/use-is-increase-contrast.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { YIELD_GROUP_COLOR } from '../../constant/yield-group-color.constant';

import type { YieldGroupEnum } from '@budgie/market';

interface Props {
    readonly group: YieldGroupEnum;
    readonly label: string;
    readonly amount: string;
    readonly amountClassName: string;
    readonly share?: string | null;
    readonly isMuted?: boolean;
    readonly isEmpty?: boolean;
}

const labelVariants = cva('flex-1 shrink text-sm', {
    variants: {
        isEmpty: { true: 'text-secondary-foreground', false: 'text-primary' },
        isMuted: { true: 'opacity-40', false: '' }
    }
});
const amountsVariants = cva('shrink-0 flex-row items-baseline justify-end gap-x-xs', {
    variants: { isAccessibilityText: { true: 'self-end', false: '' } }
});

export const YieldLegendEntry = ({ group, label, amount, amountClassName, share, isMuted = false, isEmpty = false }: Props) => {
    const isIncreaseContrast = useIsIncreaseContrast();
    const isAccessibilityText = useIsAccessibilityTextSize();

    const dotClassName = cn(
        YIELD_GROUP_COLOR[group][isIncreaseContrast ? 'backgroundContrast' : 'background'],
        (isMuted || isEmpty) && 'opacity-40'
    );
    const labelClassName = labelVariants({ isEmpty, isMuted });
    const amountsClassName = amountsVariants({ isAccessibilityText });
    const dot = (
        <View className="w-[12px] items-center">
            <View className={cn('h-[10px] w-[10px] rounded-full', dotClassName)} />
        </View>
    );
    const amounts = (
        <View className={amountsClassName}>
            {isNotEmptyString(share) ? (
                <Text numberOfLines={1} className="text-right text-sm tabular-nums text-secondary-foreground">
                    {share} ·
                </Text>
            ) : null}
            <Text numberOfLines={1} className={cn('text-right', amountClassName, isEmpty && 'text-secondary-foreground')}>
                {amount}
            </Text>
        </View>
    );

    if (isAccessibilityText) {
        return (
            <View className="flex-1 gap-y-xs">
                <View className="flex-row items-start gap-x-[8px]">
                    {dot}
                    <Text className={labelClassName}>{label}</Text>
                </View>
                {amounts}
            </View>
        );
    }

    return (
        <>
            {dot}
            <Text className={labelClassName}>{label}</Text>
            {amounts}
        </>
    );
};
