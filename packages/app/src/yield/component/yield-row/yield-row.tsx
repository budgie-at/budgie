import { Text, View } from 'react-native';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';

import type { ReactNode } from 'react';

interface Props {
    readonly left: ReactNode;
    readonly title: string;
    readonly subtitle: ReactNode;
    readonly trailing: ReactNode;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
    readonly testID: string;
    readonly className?: string;
}

const TITLE_LINES = 2;

export const YieldRow = ({ left, title, subtitle, trailing, accessibilityLabel, onPress, testID, className }: Props) => (
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
            <Text className="text-[17px] text-primary" numberOfLines={TITLE_LINES} maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}>
                {title}
            </Text>
            {subtitle}
        </View>
        <View className="shrink-0 items-end">{trailing}</View>
    </HapticPressable>
);
