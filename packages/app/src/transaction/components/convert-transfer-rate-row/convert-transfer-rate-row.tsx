import { InstrumentTypeEnum, TransactionTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { Text, View, useWindowDimensions } from 'react-native';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../../@generic/constant/micro-unit-decimal-places.constant';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../../@generic/hook/use-is-amount-protected.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { TRANSACTION_LARGE_TEXT_SCALE } from '../../constant/transaction-large-text-scale.constant';
import { useConvertToTransferModalParams } from '../../hook/use-convert-to-transfer-modal-params.hook';
import { TransactionFormIcon } from '../transaction-form-icon/transaction-form-icon';
import { TransactionFormRow } from '../transaction-form-row/transaction-form-row';
import { TransferQuickFormSelector } from '../transfer-quick-form/transfer-quick-form.selector';

interface Props {
    readonly destinationAmount: number;
    readonly destinationSymbol: string;
    readonly destinationInstrumentType?: InstrumentTypeEnum;
    readonly sourceCode: string;
    readonly destinationCode: string;
    readonly exchangeRate: number;
    readonly isManualRate: boolean;
    readonly onPress: () => void;
}

export const ConvertTransferRateRow = (props: Props) => {
    const {
        destinationAmount,
        destinationSymbol,
        destinationInstrumentType,
        sourceCode,
        destinationCode,
        exchangeRate,
        isManualRate,
        onPress
    } = props;
    const { t } = useLingui();
    const { fontScale } = useWindowDimensions();
    const isProtected = useIsAmountProtected();
    const params = useConvertToTransferModalParams();
    const label = params?.transactionType === TransactionTypeEnum.EXPENSE ? t`Receiving` : t`Sending`;
    const formatAmount = useFormatDigits(2, destinationInstrumentType === InstrumentTypeEnum.CRYPTO ? MICRO_UNIT_DECIMAL_PLACES : 2);
    const formatRate = useFormatDigits(0, 6);
    const amount = isProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatAmount(destinationAmount, destinationSymbol);
    const displayAmount = isManualRate ? amount : `≈ ${amount}`;
    const formattedRate = formatRate(exchangeRate);
    const rateLabel = t`1 ${sourceCode} = ${formattedRate} ${destinationCode}`;
    const rateClassName =
        fontScale >= TRANSACTION_LARGE_TEXT_SCALE
            ? 'px-3xl pb-md text-[13px] leading-[18px] text-secondary-foreground'
            : 'pl-[58px] pr-3xl pb-md text-[13px] leading-[18px] text-secondary-foreground';
    const pressableProps = { accessibilityLabel: `${label}: ${displayAmount}. ${rateLabel}`, accessibilityHint: t`Edit the amount` };

    return (
        <View>
            <TransactionFormRow
                left={<TransactionFormIcon icon={UserIconNameEnum.Coins} />}
                label={label}
                value={displayAmount}
                onPress={onPress}
                pressableProps={pressableProps}
                testID={TransferQuickFormSelector.ConversionRow}
            />
            <Text className={rateClassName} maxFontSizeMultiplier={2} accessible={false} importantForAccessibility="no-hide-descendants">
                {rateLabel}
            </Text>
        </View>
    );
};
