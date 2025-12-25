import { IntlShape } from '@formatjs/intl';

import { isNotEmptyString } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useI18nContext } from '../context/i18n.context';

export const createFormatMoney =
    (intl: IntlShape, decimalPlaces: number, currency: string, showSign = false) =>
    (rawAmount: number) => {
        const amount = convertFromMicroUnits(rawAmount).toString();

        if (!isNotEmptyString(amount)) {
            return '';
        }

        const num = Number.parseFloat(amount);
        if (Number.isNaN(num)) {
            return '';
        }

        return intl
            .formatNumber(num, {
                currency,
                style: 'currency',
                maximumFractionDigits: decimalPlaces,
                minimumFractionDigits: decimalPlaces,
                signDisplay: showSign ? 'always' : 'never'
            })
            .replace('UAH ', '₴');
    };

export const useFormatMoney = (decimalPlaces: number, currency: string, showSign = false) => {
    const { intl } = useI18nContext();

    return createFormatMoney(intl, decimalPlaces, currency, showSign);
};
