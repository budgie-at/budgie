import { InstrumentTypeEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../@generic/constant/micro-unit-decimal-places.constant';

import { useDisplayFormatDigits } from './use-display-format-digits.hook';
import { useFormatDigits } from './use-format-digits.hook';

export const useFormatInstrumentAmount = () => {
    const formatDigits = useDisplayFormatDigits();
    const formatCryptoDigits = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);

    return (amount: number, symbol: string, instrumentType: InstrumentTypeEnum | null) => {
        if (instrumentType !== InstrumentTypeEnum.CRYPTO) {
            return formatDigits(amount, symbol);
        }

        const formatted = formatCryptoDigits(amount);

        return isNotEmptyString(symbol) ? `${formatted} ${symbol}` : formatted;
    };
};
