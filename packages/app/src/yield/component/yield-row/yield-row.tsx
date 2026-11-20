import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';

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
        <View className="min-w-0 flex-1 gap-y-xxs pr-sm">
            <Text className="text-[17px] text-primary" numberOfLines={1} maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}>
                {title}
            </Text>
            {isNotEmptyString(subtitle) ? (
                <Text
                    className="text-[13px] leading-[18px] text-secondary-foreground"
                    numberOfLines={2}
                    maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                >
                    {subtitle}
                </Text>
            ) : null}
        </View>
        <View className="w-[40%] shrink-0 items-end">{trailing}</View>
    </HapticPressable>
);
