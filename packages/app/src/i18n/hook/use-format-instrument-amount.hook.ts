import { InstrumentTypeEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../@generic/constant/micro-unit-decimal-places.constant';
import { isListedSecurityType } from '../../instrument/utils/is-listed-security-type.util';

import { useDisplayFormatDigits } from './use-display-format-digits.hook';
import { useFormatDigits } from './use-format-digits.hook';
import { useFormatFundQuantity } from './use-format-fund-quantity.hook';

export const useFormatInstrumentAmount = () => {
    const formatDigits = useDisplayFormatDigits();
    const formatCryptoDigits = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);
    const formatFundQuantity = useFormatFundQuantity();

    return (amount: number, symbol: string, instrumentType: InstrumentTypeEnum | null) => {
        if (instrumentType === InstrumentTypeEnum.FUND) {
            return formatFundQuantity(amount);
        }

        if (instrumentType !== InstrumentTypeEnum.CRYPTO && !isListedSecurityType(instrumentType)) {
            return formatDigits(amount, symbol);
        }

        const formatted = formatCryptoDigits(amount);

        return isNotEmptyString(symbol) ? `${formatted} ${symbol}` : formatted;
    };
};
