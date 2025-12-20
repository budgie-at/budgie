import { isNotEmptyString } from '@rnw-community/shared';

import { useI18nContext } from '../context/i18n.context';

export const useFormatMoney = (decimalPlaces: number, currency: string, showSign = false) => {
    const { intl } = useI18nContext();

    return (rawAmount: number) => {
        const amount = rawAmount.toString();

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
            minimumFractionDigits: decimalPlaces,
            signDisplay: showSign ? 'always' : 'never'
        });
    };
};
