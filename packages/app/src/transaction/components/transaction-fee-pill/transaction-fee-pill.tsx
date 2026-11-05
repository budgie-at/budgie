import { InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
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

    const formattedAmount = isAmountProtected
        ? PROTECTED_AMOUNT_PLACEHOLDER
        : formatInstrumentAmount(amount, currencySymbol, instrumentType ?? null);
    const label = hasFee ? t`Fee ${formattedAmount}` : t`Set fee`;
    const visualLabel = hasFee ? formattedAmount : label;
    const icon = hasFee ? UserIconNameEnum.Receipt : UserIconNameEnum.Plus;

    return (
        <HapticPressable
            accessibilityLabel={label}
            accessibilityRole="button"
            className="min-h-[44px] max-w-full shrink justify-center active:opacity-70"
            hitSlop={HIT_SLOP}
            onPress={onPress}
            testID={TransactionFeePillSelector.Pill}
        >
            <View className="min-h-[28px] max-w-full flex-row items-center gap-x-[6px] rounded-full border-hairline border-surface-separator px-[8px] py-[4px]">
                <Icon icon={icon} size={16} className="text-primary" />
                <Text
                    accessible={false}
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    className="shrink text-[15px] leading-[20px] font-medium tabular-nums text-primary"
                    maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                    numberOfLines={1}
                >
                    {visualLabel}
                </Text>
            </View>
        </HapticPressable>
    );
};
