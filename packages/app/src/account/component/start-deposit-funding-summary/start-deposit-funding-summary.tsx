import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { Control, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { DepositDetailsRow } from '../deposit-details-row/deposit-details-row';

import { StartDepositFundingSummarySelector } from './start-deposit-funding-summary.selector';

import type { DepositAccountFormValues } from '../../interface/deposit-account-form-values.interface';

interface Props {
    readonly control: Control<DepositAccountFormValues>;
    readonly sourceAccountTitle: string;
    readonly sourceAmount: number;
    readonly sourceSymbol: string;
    readonly sourceCode: string;
    readonly destinationCode: string;
}

const RATE_MAXIMUM_DECIMAL_PLACES = 4;

const containerVariants = cva('p-5xl border gap-y-lg rounded-3xl', {
    variants: { variant: BACKGROUND_COLOR_PALETTE }
});

export const StartDepositFundingSummary = ({
    control,
    sourceAccountTitle,
    sourceAmount,
    sourceSymbol,
    sourceCode,
    destinationCode
}: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatAmountDigits = useFormatDigits(decimalPlaces);
    const formatRateDigits = useFormatDigits(0, RATE_MAXIMUM_DECIMAL_PLACES);
    const receivingAmount = useWatch({ control, name: 'currentBalance' });

    const exchangeRateText = isPositiveNumber(receivingAmount)
        ? `1 ${destinationCode} = ${formatRateDigits(sourceAmount / receivingAmount)} ${sourceCode}`
        : '—';

    return (
        <View className={containerVariants({ variant: 'secondary' })} testID={StartDepositFundingSummarySelector.Container}>
            <DepositDetailsRow
                testID={StartDepositFundingSummarySelector.FundingAccountRow}
                label={<Trans>Funding account</Trans>}
                value={sourceAccountTitle}
            />
            <DepositDetailsRow
                testID={StartDepositFundingSummarySelector.FundingAmountRow}
                label={<Trans>Funding amount</Trans>}
                value={formatAmountDigits(sourceAmount, sourceSymbol)}
            />
            <DepositDetailsRow
                testID={StartDepositFundingSummarySelector.ExchangeRateRow}
                label={<Trans>Exchange rate</Trans>}
                value={exchangeRateText}
            />
        </View>
    );
};
