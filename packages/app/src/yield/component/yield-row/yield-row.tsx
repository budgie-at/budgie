import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { YieldRowChevron } from '../yield-row-chevron/yield-row-chevron';

import type { ReactNode } from 'react';

interface Props {
    readonly left?: ReactNode;
    readonly title: string;
    readonly subtitle?: string;
    readonly trailing?: ReactNode;
    readonly accessibilityLabel: string;
    readonly onPress: (() => void) | null;
    readonly testID: string;
    readonly className?: string;
}

const TITLE_LINES = 2;

export const YieldRow = ({ left, title, subtitle, trailing, accessibilityLabel, onPress, testID, className }: Props) => {
    const isPressable = isDefined(onPress);

    const content = (
        <>
            {left}
            <View className="min-w-0 flex-1 gap-y-xxs">
                <Text className="text-[17px] text-primary" numberOfLines={TITLE_LINES} maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}>
                    {title}
                </Text>
                {isDefined(subtitle) ? (
                    <Text
                        className="text-[13px] leading-[18px] text-secondary-foreground"
                        numberOfLines={1}
                        maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
                    >
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            <View className="shrink-0 flex-row items-center gap-x-sm">
                {trailing}
                {isPressable ? <YieldRowChevron /> : null}
            </View>
        </>
    );

    if (!isPressable) {
        return (
            <View
                accessible
                accessibilityRole="text"
                accessibilityLabel={accessibilityLabel}
                className={cn('min-h-[56px] flex-row items-center gap-x-xl bg-grouped-surface-row px-3xl py-lg', className)}
                testID={testID}
            >
                {content}
            </View>
        );
    }

    return (
        <HapticPressable
            pressedScale={1}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            className={cn('min-h-[56px] flex-row items-center gap-x-xl bg-grouped-surface-row px-3xl py-lg active:opacity-70', className)}
            onPress={onPress}
            testID={testID}
        >
            {content}
        </HapticPressable>
    );
};
