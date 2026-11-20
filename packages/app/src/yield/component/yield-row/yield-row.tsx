import { useWindowDimensions, Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { YIELD_NARROW_WINDOW_WIDTH } from '../../constant/yield-narrow-window-width.constant';
import { YieldRowSubtitle } from '../yield-row-subtitle/yield-row-subtitle';

import type { ReactNode } from 'react';

interface Props {
    readonly left: ReactNode;
    readonly title: string;
    readonly subtitle: string;
    readonly trailing: ReactNode;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
    readonly testID: string;
    readonly className?: string;
}

export const YieldRow = ({ left, title, subtitle, trailing, accessibilityLabel, onPress, testID, className }: Props) => {
    const { width } = useWindowDimensions();

    const titleLines = width <= YIELD_NARROW_WINDOW_WIDTH ? 1 : 2;

    return (
        <HapticPressable
            pressedScale={1}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            className={cn('min-h-[56px] flex-row items-center gap-x-xl bg-grouped-surface-row px-3xl py-lg active:opacity-70', className)}
            onPress={onPress}
            testID={testID}
        >
            {left}
            <View className="min-w-0 flex-1 gap-y-xxs">
                <Text className="text-[17px] text-primary" numberOfLines={titleLines} maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}>
                    {title}
                </Text>
                {isNotEmptyString(subtitle) ? <YieldRowSubtitle subtitle={subtitle} /> : null}
            </View>
            <View className="shrink-0 items-end">{trailing}</View>
        </HapticPressable>
    );
};
