import { CurrencyEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../utils/convert-from-micro-units.util';

import { useLocaleInfo } from './use-locale-info.hook';

export const useFormatMoney = (decimalPlaces: number) => {
    const { languageCode, regionCode } = useLocaleInfo();

    return (rawAmount: number, currency: CurrencyEnum) => {
        const amount = convertFromMicroUnits(rawAmount).toString();

        if (!isNotEmptyString(amount)) {
            return '';
        }

        const num = Number.parseFloat(amount);
        if (Number.isNaN(num)) {
            return '';
        }

        const intl = new Intl.NumberFormat(`${languageCode}-${regionCode}`, {
            currency,
            style: 'currency',
            useGrouping: true,
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces
        });

        return intl.format(num);
    };
};
