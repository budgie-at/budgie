import { InstrumentTypeEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../@generic/constant/micro-unit-decimal-places.constant';
import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';

import { useFormatDigits } from './use-format-digits.hook';

export const useFormatInstrumentAmount = () => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatDigits = useFormatDigits(decimalPlaces);
    const formatCryptoDigits = useFormatDigits(0, MICRO_UNIT_DECIMAL_PLACES);

    return (amount: number, symbol: string, instrumentType: InstrumentTypeEnum | null) =>
        instrumentType === InstrumentTypeEnum.CRYPTO ? `${formatCryptoDigits(amount)} ${symbol}` : formatDigits(amount, symbol);
};
