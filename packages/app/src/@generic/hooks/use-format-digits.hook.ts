import { isNotEmptyString } from '@rnw-community/shared';

import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { useLocaleInfo } from '../../i18n/hook/use-locale-info.hook';

export const useFormatDigits = (decimalPlaces = DEFAULT_DECIMAL_PLACES) => {
    const { languageCode, regionCode } = useLocaleInfo();

    const intl = new Intl.NumberFormat(`${languageCode}-${regionCode}`, {
        style: 'decimal',
        useGrouping: true,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
    });

    return (rawNumeric: string) => {
        if (!isNotEmptyString(rawNumeric)) {
            return '';
        }

        const num = Number.parseFloat(rawNumeric);

        if (Number.isNaN(num)) {
            return '';
        }

        return intl.format(num);
    };
};
