import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';
import Animated, { FadeInUp, ReduceMotion } from 'react-native-reanimated';

import { isPositiveNumber } from '@rnw-community/shared';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { TransactionFormIcon } from '../transaction-form-icon/transaction-form-icon';
import { TransactionFormRow } from '../transaction-form-row/transaction-form-row';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';

interface Props {
    readonly label: string;
    readonly destinationAmount: number;
    readonly destinationSymbol: string;
    readonly sourceCode: string;
    readonly destinationCode: string;
    readonly exchangeRate: number;
    readonly isManualRate: boolean;
    readonly onPress: () => void;
}

const ANIMATION_DELAY = 100;
const ANIMATION_DURATION = 200;
const ENTERING_ANIMATION = FadeInUp.delay(ANIMATION_DELAY).duration(ANIMATION_DURATION).reduceMotion(ReduceMotion.System);

export const ConversionRow = (props: Props) => {
    const { label, destinationAmount, destinationSymbol, sourceCode, destinationCode, exchangeRate, isManualRate, onPress } = props;
    const { t } = useLingui();
    const isAmountProtected = useIsAmountProtected();
    const formatAmount = useFormatDigits(2);
    const formatRate = useFormatDigits(0, 6);

    const prefix = isManualRate ? '' : '\u2248 ';
    const formattedAmount = formatAmount(isPositiveNumber(destinationAmount) ? destinationAmount : 0, destinationSymbol);
    const formattedRate = isPositiveNumber(exchangeRate) ? formatRate(exchangeRate) : '—';
    const rateLabel = t`1 ${sourceCode} = ${formattedRate} ${destinationCode}`;
    const exchangeRateLabel = t`Exchange rate: ${rateLabel}`;
    const displayAmount = isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : `${prefix}${formattedAmount}`;
    const pressableProps = {
        accessibilityLabel: `${label}: ${displayAmount}. ${exchangeRateLabel}`,
        accessibilityHint: t`Edit the amount`
    };

    return (
        <Animated.View entering={ENTERING_ANIMATION}>
            <TransactionFormRow
                left={<TransactionFormIcon icon={UserIconNameEnum.Coins} />}
                label={label}
                value={displayAmount}
                onPress={onPress}
                testID={TransferQuickFormSelector.ConversionRow}
                pressableProps={pressableProps}
            />
            <Text
                className="-mt-[8px] pr-[44px] pb-[10px] text-right text-[13px] leading-[18px] text-secondary-foreground"
                maxFontSizeMultiplier={2}
            >
                {rateLabel}
            </Text>
        </Animated.View>
    );
};
