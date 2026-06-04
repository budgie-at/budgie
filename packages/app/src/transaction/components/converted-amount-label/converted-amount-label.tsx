import { Text } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { formatExchangeRate } from '../../../@generic/utils/format-exchange-rate.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useConvertedAmount } from '../../hook/use-converted-amount.hook';

interface Props {
    readonly instrumentId: number;
    readonly instrumentSymbol: string;
    readonly amount: number;
    readonly baseAmount: number | null;
    readonly shouldShowExchangeRate?: boolean;
}

export const ConvertedAmountLabel = ({ instrumentId, instrumentSymbol, amount, baseAmount, shouldShowExchangeRate = false }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const liveConversion = useConvertedAmount(instrumentId, defaultInstrument.id, amount);
    const convertedAmount = isDefined(baseAmount) ? baseAmount : liveConversion?.amount;
    const exchangeRate =
        isDefined(baseAmount) && isPositiveNumber(Math.abs(amount)) ? baseAmount / Math.abs(amount) : liveConversion?.exchangeRate;

    if (!isDefined(convertedAmount)) {
        return null;
    }

    const formattedConvertedAmount = formatDigits(convertFromMicroUnits(convertedAmount), defaultInstrument.symbol);
    const formattedExchangeRate =
        shouldShowExchangeRate && isDefined(exchangeRate)
            ? ` | 1 ${instrumentSymbol} = ${defaultInstrument.symbol}${formatExchangeRate(exchangeRate)}`
            : '';

    return (
        <Text className="text-xxs text-secondary-foreground text-right">
            {formattedConvertedAmount}
            {formattedExchangeRate}
        </Text>
    );
};
