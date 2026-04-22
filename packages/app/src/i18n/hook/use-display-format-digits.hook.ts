import { useSettingsContext } from '../../settings/context/settings.context';

import { useFormatDigits } from './use-format-digits.hook';

export const useDisplayFormatDigits = () => {
    const { decimalPlaces } = useSettingsContext();

    return useFormatDigits(decimalPlaces);
};
