import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Control, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { BACKGROUND_COLOR_PALETTE } from '../../../@generic/constant/background-color-palette.constant';
import { cn } from '../../../@generic/utils/cn.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { START_DEPOSIT_RATE_MAXIMUM_DECIMAL_PLACES } from '../../constant/start-deposit-rate-maximum-decimal-places.constant';
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

export const StartDepositFundingSummary = ({
    control,
    sourceAccountTitle,
    sourceAmount,
    sourceSymbol,
    sourceCode,
    destinationCode
}: Props) => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatAmountDigits = useFormatDigits(decimalPlaces);
    const formatRateDigits = useFormatDigits(0, START_DEPOSIT_RATE_MAXIMUM_DECIMAL_PLACES);
    const receivingAmount = useWatch({ control, name: 'currentBalance' });

    const exchangeRateText = isPositiveNumber(receivingAmount)
        ? `1 ${destinationCode} = ${formatRateDigits(sourceAmount / receivingAmount)} ${sourceCode}`
        : '—';

    return (
        <View
            className={cn('p-5xl border gap-y-lg rounded-3xl', BACKGROUND_COLOR_PALETTE.secondary)}
            testID={StartDepositFundingSummarySelector.Container}
        >
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
