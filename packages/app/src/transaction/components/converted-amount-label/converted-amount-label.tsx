import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { formatExchangeRate } from '../../../@generic/utils/format-exchange-rate.util';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useConvertedAmount } from '../../hook/use-converted-amount.hook';

interface Props {
    readonly instrumentId: number;
    readonly instrumentSymbol: string;
    readonly amount: number;
    readonly baseAmount: number | null;
    readonly shouldShowExchangeRate?: boolean;
}

export const ConvertedAmountLabel = ({ instrumentId, instrumentSymbol, amount, baseAmount, shouldShowExchangeRate = false }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatDigits = useDisplayFormatDigits();
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
        <Text className="text-[13px] text-secondary-foreground text-right tabular-nums">
            {formattedConvertedAmount}
            {formattedExchangeRate}
        </Text>
    );
};
