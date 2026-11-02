import { InstrumentTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';

import { TransactionFeePillSelector } from './transaction-fee-pill.selector';

interface Props {
    readonly amount: number;
    readonly currencySymbol: string;
    readonly instrumentType?: InstrumentTypeEnum;
    readonly showEmptyState?: boolean;
    readonly onPress: () => void;
}

const HIT_SLOP = 6;

export const TransactionFeePill = ({ amount, currencySymbol, instrumentType, showEmptyState = false, onPress }: Props) => {
    const isAmountProtected = useIsAmountProtected();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const hasFee = isPositiveNumber(amount);

    if (!hasFee && !showEmptyState) {
        return null;
    }

    const formattedAmount = formatInstrumentAmount(amount, currencySymbol, instrumentType ?? null);
    const label = hasFee ? t`Fee ${formattedAmount}` : t`Set fee`;
    const protectedLabel = t`Fee ${PROTECTED_AMOUNT_PLACEHOLDER}`;
    const accessibilityLabel = hasFee && isAmountProtected ? protectedLabel : label;
    const labelStyle = { opacity: hasFee && isAmountProtected ? 0 : 1 };
    const labelClassName = hasFee ? 'text-primary' : 'text-secondary-foreground';

    return (
        <HapticPressable
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            className="min-h-[44px] max-w-full shrink justify-center active:opacity-70"
            hitSlop={HIT_SLOP}
            onPress={onPress}
            testID={TransactionFeePillSelector.Pill}
        >
            <View className="min-h-[28px] max-w-full flex-row items-center rounded-full border-hairline border-surface-separator bg-transaction-detail-row px-xl py-[4px] dark:border-transparent">
                <Text
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    style={labelStyle}
                    className={cn('shrink text-[13px] leading-[18px] font-medium tabular-nums', labelClassName)}
                    maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                    numberOfLines={1}
                >
                    {label}
                </Text>
                {hasFee && isAmountProtected ? (
                    <View className="absolute inset-0 items-center justify-center px-xl" pointerEvents="none">
                        <Text
                            accessible={false}
                            className="text-[13px] leading-[18px] font-medium tabular-nums text-primary"
                            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                            numberOfLines={1}
                        >
                            {protectedLabel}
                        </Text>
                    </View>
                ) : null}
            </View>
        </HapticPressable>
    );
};
