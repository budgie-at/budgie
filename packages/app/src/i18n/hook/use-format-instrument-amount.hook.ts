import { InstrumentTypeEnum } from '@budgie/contracts';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../@generic/constant/micro-unit-decimal-places.constant';

import { useDisplayFormatDigits } from './use-display-format-digits.hook';
import { useFormatDigits } from './use-format-digits.hook';

export const useFormatInstrumentAmount = () => {
    const formatDigits = useDisplayFormatDigits();
    const formatCryptoDigits = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);

    return (amount: number, symbol: string, instrumentType: InstrumentTypeEnum | null) =>
        instrumentType === InstrumentTypeEnum.CRYPTO ? `${formatCryptoDigits(amount)} ${symbol}` : formatDigits(amount, symbol);
};
