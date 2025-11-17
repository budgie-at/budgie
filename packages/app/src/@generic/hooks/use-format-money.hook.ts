import { CurrencyEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../utils/convert-from-micro-units.util';

import { useLocaleInfo } from './use-locale-info.hook';

export const useFormatMoney = (decimalPlaces: number, currency: CurrencyEnum) => {
    const { languageCode, regionCode } = useLocaleInfo();

    const intl = new Intl.NumberFormat(`${languageCode}-${regionCode}`, {
        currency,
        style: 'currency',
        useGrouping: true,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
    });

    return (rawAmount: number) => {
        const amount = convertFromMicroUnits(rawAmount).toString();

        if (!isNotEmptyString(amount)) {
            return '';
        }

        const num = Number.parseFloat(amount);
        if (Number.isNaN(num)) {
            return '';
        }

        return intl.format(num);
    };
};
