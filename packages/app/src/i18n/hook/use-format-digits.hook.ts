import { isNotEmptyString, isNumber } from '@rnw-community/shared';

import { useI18nContext } from '../context/i18n.context';

export const useFormatDigits = (decimalPlaces: number, maxDecimalPlaces: number = decimalPlaces) => {
    const { intl } = useI18nContext();

    return (rawNumeric: string | number, symbol = '') => {
        if (isNumber(rawNumeric)) {
            const formatted = intl.formatNumber(rawNumeric, {
                style: 'decimal',
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: maxDecimalPlaces
            });

            return `${symbol}${formatted}`;
        }

        if (!isNotEmptyString(rawNumeric)) {
            return '';
        }

        const num = Number.parseFloat(rawNumeric);

        if (Number.isNaN(num)) {
            return '';
        }

        const formatted = intl.formatNumber(num, {
            style: 'decimal',
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: maxDecimalPlaces
        });

        return `${symbol}${formatted}`;
    };
};
