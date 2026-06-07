import { useSettingsContext } from '../../settings/context/settings.context';
import { CRYPTO_DECIMAL_PLACES } from '../constant/crypto-decimal-places.constant';

import { useFormatDigits } from './use-format-digits.hook';

export const useCryptoFormatDigits = () => {
    const { decimalPlaces } = useSettingsContext();

    return useFormatDigits(decimalPlaces, CRYPTO_DECIMAL_PLACES);
};
