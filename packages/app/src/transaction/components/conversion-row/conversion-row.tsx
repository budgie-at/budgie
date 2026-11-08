import { InstrumentTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, useWindowDimensions } from 'react-native';
import Animated, { FadeInUp, ReduceMotion } from 'react-native-reanimated';

import { isPositiveNumber } from '@rnw-community/shared';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';
import { TransactionFormIcon } from '../transaction-form-icon/transaction-form-icon';
import { TransactionFormRow } from '../transaction-form-row/transaction-form-row';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';

import type { ConversionRateInterface } from '../../interface/conversion-rate.interface';

interface Props {
    readonly label: string;
    readonly destinationAmount: number;
    readonly destinationSymbol: string;
    readonly rate: ConversionRateInterface;
    readonly destinationInstrumentType?: InstrumentTypeEnum;
    readonly isManualRate: boolean;
    readonly onPress: () => void;
}

const ANIMATION_DELAY = 100;
const ANIMATION_DURATION = 200;
const ENTERING_ANIMATION = FadeInUp.delay(ANIMATION_DELAY).duration(ANIMATION_DURATION).reduceMotion(ReduceMotion.System);

export const ConversionRow = (props: Props) => {
    const {
        label,
        destinationAmount,
        destinationSymbol,
        rate: { sourceCode, destinationCode, exchangeRate },
        destinationInstrumentType,
        isManualRate,
        onPress
    } = props;
    const { t } = useLingui();
    const isAmountProtected = useIsAmountProtected();
    const { fontScale } = useWindowDimensions();
    const formatAmount = useFormatDigits(2, destinationInstrumentType === InstrumentTypeEnum.CRYPTO ? MICRO_UNIT_DECIMAL_PLACES : 2);
    const formatRate = useFormatDigits(0, 6);

    const prefix = isManualRate ? '' : '\u2248 ';
    const formattedAmount = formatAmount(isPositiveNumber(destinationAmount) ? destinationAmount : 0, destinationSymbol);
    const formattedRate = isPositiveNumber(exchangeRate) ? formatRate(exchangeRate) : '—';
    const rateLabel = t`1 ${sourceCode} = ${formattedRate} ${destinationCode}`;
    const exchangeRateLabel = t`Exchange rate: ${rateLabel}`;
    const displayAmount = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : `${prefix}${formattedAmount}`;
    const pressableProps = {
        onPress,
        accessibilityLabel: `${label}: ${displayAmount}. ${exchangeRateLabel}`,
        accessibilityHint: t`Edit the amount`
    };

    const rateClassName =
        fontScale >= TRANSACTION_LARGE_TEXT_SCALE
            ? 'px-3xl pb-md text-[13px] leading-[18px] text-secondary-foreground'
            : 'pl-[58px] pr-3xl pb-md text-[13px] leading-[18px] text-secondary-foreground';

    return (
        <Animated.View entering={ENTERING_ANIMATION}>
            <TransactionFormRow
                left={<TransactionFormIcon icon={UserIconNameEnum.Coins} />}
                label={label}
                value={displayAmount}
                testID={TransferQuickFormSelector.ConversionRow}
                pressableProps={pressableProps}
            />
            <Text className={rateClassName} maxFontSizeMultiplier={2} accessible={false} importantForAccessibility="no-hide-descendants">
                {rateLabel}
            </Text>
        </Animated.View>
    );
};
