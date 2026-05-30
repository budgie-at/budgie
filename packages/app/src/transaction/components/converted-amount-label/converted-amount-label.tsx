import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useConvertedAmount } from '../../hook/use-converted-amount.hook';

interface Props {
    readonly instrumentId: number;
    readonly amount: number;
    readonly baseAmount: number | null;
}

export const ConvertedAmountLabel = ({ instrumentId, amount, baseAmount }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const liveConvertedAmount = useConvertedAmount(instrumentId, defaultInstrument.id, amount);
    const convertedAmount = isDefined(baseAmount) ? baseAmount : liveConvertedAmount;

    if (!isDefined(convertedAmount)) {
        return null;
    }

    return (
        <Text className="text-xxs text-secondary-foreground text-right">
            {formatDigits(convertFromMicroUnits(convertedAmount), defaultInstrument.symbol)}
        </Text>
    );
};
