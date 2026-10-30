import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { Text, View, useWindowDimensions } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { cn } from '../../../@generic/utils/cn.util';
import { TRANSACTION_INFO_ROW_MAX_FONT_SCALE } from '../../constant/transaction-info-row-max-font-scale.constant';
import { TRANSACTION_INFO_STACKED_FONT_SCALE } from '../../constant/transaction-info-stacked-font-scale.constant';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly icon: UserIconType;
    readonly label?: string;
    readonly value?: string | null;
    readonly description?: string | null;
    readonly trailing?: string | null;
    readonly valueClassName?: string;
    readonly testID: string;
    readonly onPress?: () => void;
}

const contentVariants = cva('flex-1 min-w-0 gap-x-xl gap-y-xs', {
    variants: {
        largeText: {
            true: 'items-start self-stretch',
            false: 'flex-row items-center'
        }
    }
});

const rowVariants = cva('flex-row items-center gap-x-xl px-3xl', {
    variants: {
        largeText: {
            true: 'py-md',
            false: 'min-h-[56px] py-xl'
        }
    }
});

export const TransactionInfoRow = (props: Props) => {
    const { icon, label, value, description, trailing, valueClassName, testID, onPress } = props;
    const { fontScale } = useWindowDimensions();
    const largeText = fontScale > TRANSACTION_INFO_STACKED_FONT_SCALE;
    const iconSize = 22 * fontScale;
    const chevronSize = 20 * Math.min(fontScale, TRANSACTION_INFO_STACKED_FONT_SCALE);
    const showChevron = isDefined(onPress) && !largeText;
    const textContentClassName = largeText ? 'self-stretch min-w-0' : 'flex-1 min-w-0';
    const accessibilityLabel = [label, value, description, trailing].filter(isNotEmptyString).join(', ');
    const separatorClassName = largeText ? 'left-3xl' : 'left-[56px]';
    const row = (
        <View
            accessible={!isDefined(onPress)}
            accessibilityLabel={accessibilityLabel}
            className={rowVariants({ largeText })}
            collapsable={false}
            nativeID={testID}
            testID={testID}
        >
            <View className={cn('absolute top-0 right-0 h-hairline bg-surface-separator', separatorClassName)} pointerEvents="none" />

            {largeText ? null : (
                <View className="h-[28px] w-[28px] items-center justify-center">
                    <Icon icon={icon} size={iconSize} className="text-secondary-foreground" />
                </View>
            )}

            <View className={contentVariants({ largeText })}>
                <View className={textContentClassName}>
                    {isNotEmptyString(label) ? (
                        <Text
                            maxFontSizeMultiplier={TRANSACTION_INFO_ROW_MAX_FONT_SCALE}
                            className="text-[13px] leading-[18px] text-transaction-detail-secondary"
                        >
                            {label}
                        </Text>
                    ) : null}
                    {isNotEmptyString(value) ? (
                        <Text
                            maxFontSizeMultiplier={TRANSACTION_INFO_ROW_MAX_FONT_SCALE}
                            className={cn('text-[17px] leading-[22px] text-primary font-medium', valueClassName)}
                            selectable
                        >
                            {value}
                        </Text>
                    ) : null}
                    {isNotEmptyString(description) ? (
                        <Text
                            maxFontSizeMultiplier={TRANSACTION_INFO_ROW_MAX_FONT_SCALE}
                            className="text-[13px] leading-[18px] text-transaction-detail-secondary"
                            selectable
                        >
                            {description}
                        </Text>
                    ) : null}
                </View>

                {isNotEmptyString(trailing) ? (
                    <Text
                        maxFontSizeMultiplier={TRANSACTION_INFO_ROW_MAX_FONT_SCALE}
                        className="shrink-0 text-[17px] leading-[22px] text-primary font-medium text-right tabular-nums"
                        selectable
                    >
                        {trailing}
                    </Text>
                ) : null}
            </View>

            {showChevron ? <Icon icon={UserIconNameEnum.ChevronRight} size={chevronSize} className="text-secondary-foreground" /> : null}
        </View>
    );

    if (isDefined(onPress)) {
        return (
            <HapticPressable
                testID={testID}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                onPress={onPress}
                className="active:scale-100 active:opacity-70"
            >
                {row}
            </HapticPressable>
        );
    }

    return row;
};
