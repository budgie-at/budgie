import { InstrumentTypeEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { ProtectedText } from '../../../@generic/component/protected-text/protected-text';
import { PROTECTED_HERO_PLACEHOLDER } from '../../../@generic/constant/protected-hero-placeholder.constant';
import { ROW_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/row-max-font-size-multiplier.constant';
import { TITLE_MAX_FONT_SIZE_MULTIPLIER } from '../../../@generic/constant/title-max-font-size-multiplier.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { MILLION } from '../../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { useFormatInstrumentAmount } from '../../../i18n/hook/use-format-instrument-amount.hook';

interface Props {
    readonly amount: number;
    readonly instrumentCode: string;
    readonly valueLabel: string | null;
    readonly isStacked: boolean;
}

export const CurrencyMarketAccountAmount = ({ amount, instrumentCode, valueLabel, isStacked }: Props) => {
    const isAmountProtected = useIsAmountProtected();
    const formatInstrumentAmount = useFormatInstrumentAmount();
    const formatCompactDigits = useFormatCompactDigits(MILLION);

    const amountLabel =
        Math.abs(amount) >= MILLION
            ? `${formatCompactDigits(amount)} ${instrumentCode}`
            : formatInstrumentAmount(amount, instrumentCode, InstrumentTypeEnum.CRYPTO);
    const containerClassName = isStacked ? 'items-start justify-center' : 'shrink-0 items-end justify-center';
    const alignClassName = isStacked ? 'text-left' : 'text-right';

    return (
        <View className={containerClassName}>
            <ProtectedText
                className={cn('text-primary text-[15px] leading-[20px] tabular-nums', alignClassName)}
                placeholderText={PROTECTED_HERO_PLACEHOLDER}
                maxFontSizeMultiplier={ROW_MAX_FONT_SIZE_MULTIPLIER}
            >
                {amountLabel}
            </ProtectedText>
            {isDefined(valueLabel) && !isAmountProtected ? (
                <Text
                    className={cn('text-secondary-foreground text-[13px] leading-[18px] tabular-nums', alignClassName)}
                    maxFontSizeMultiplier={TITLE_MAX_FONT_SIZE_MULTIPLIER}
                >
                    {valueLabel}
                </Text>
            ) : null}
        </View>
    );
};
