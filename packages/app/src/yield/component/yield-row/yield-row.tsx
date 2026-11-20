import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';

import type { ReactNode } from 'react';

interface Props {
    readonly left: ReactNode;
    readonly title: string;
    readonly subtitle: string;
    readonly trailing: ReactNode;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
    readonly testID: string;
}

export const YieldRow = ({ left, title, subtitle, trailing, accessibilityLabel, onPress, testID }: Props) => (
    <HapticPressable
        pressedScale={1}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className="min-h-[60px] flex-row items-center gap-x-xl bg-grouped-surface-row px-3xl py-lg active:opacity-70"
        onPress={onPress}
        testID={testID}
    >
        {left}
        <View className="min-w-0 flex-1 gap-y-xxs">
            <Text className="text-[17px] text-primary" numberOfLines={2} maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}>
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
        <View className="max-w-[45%] shrink-0 items-end">{trailing}</View>
    </HapticPressable>
);
