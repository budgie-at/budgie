import { InstrumentTypeEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../@generic/constant/micro-unit-decimal-places.constant';

import { useDisplayFormatDigits } from './use-display-format-digits.hook';
import { useFormatDigits } from './use-format-digits.hook';

const LARGE_CRYPTO_AMOUNT = 1000;
const LARGE_CRYPTO_FRACTION_DIGITS = 2;

export const useFormatInstrumentAmount = () => {
    const formatDigits = useDisplayFormatDigits();
    const formatCryptoDigits = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);
    const formatLargeCryptoDigits = useFormatDigits(0, LARGE_CRYPTO_FRACTION_DIGITS);

    const formatCryptoAmount = (amount: number, symbol: string) => {
        const formatted = Math.abs(amount) >= LARGE_CRYPTO_AMOUNT ? formatLargeCryptoDigits(amount) : formatCryptoDigits(amount);

        return isNotEmptyString(symbol) ? `${formatted} ${symbol}` : formatted;
    };

    return (amount: number, symbol: string, instrumentType: InstrumentTypeEnum | null) =>
        instrumentType === InstrumentTypeEnum.CRYPTO ? formatCryptoAmount(amount, symbol) : formatDigits(amount, symbol);
};
