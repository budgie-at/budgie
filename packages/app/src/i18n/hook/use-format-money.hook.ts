import { CurrencyEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useI18nContext } from '../context/i18n.context';

export const useFormatMoney = (decimalPlaces: number, currency: CurrencyEnum) => {
    const { intl } = useI18nContext();

    return (rawAmount: number) => {
        const amount = convertFromMicroUnits(rawAmount).toString();

        if (!isNotEmptyString(amount)) {
            return '';
        }

        const num = Number.parseFloat(amount);
        if (Number.isNaN(num)) {
            return '';
        }

        return intl.formatNumber(num, {
            currency,
            style: 'currency',
            maximumFractionDigits: decimalPlaces,
            minimumFractionDigits: decimalPlaces
        });
    };
};
