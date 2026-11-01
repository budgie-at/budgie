import { InstrumentTypeEnum } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { Text } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/max-font-size-multiplier.constant';
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
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const hasFee = isPositiveNumber(amount);

    if (!hasFee && !showEmptyState) {
        return null;
    }

    const formattedAmount = formatInstrumentAmount(amount, currencySymbol, instrumentType ?? null);
    const label = hasFee ? t`Fee ${formattedAmount}` : t`Set fee`;
    const labelClassName = hasFee ? 'text-primary' : 'text-secondary-foreground';

    return (
        <HapticPressable
            accessibilityLabel={label}
            accessibilityRole="button"
            className="min-h-[32px] max-w-full flex-row items-center rounded-full border-hairline border-surface-separator bg-transaction-detail-row px-xl dark:border-transparent active:opacity-70"
            hitSlop={HIT_SLOP}
            onPress={onPress}
            testID={TransactionFeePillSelector.Pill}
        >
            <Text
                className={cn('shrink text-[13px] font-medium tabular-nums', labelClassName)}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                numberOfLines={1}
            >
                {label}
            </Text>
        </HapticPressable>
    );
};
