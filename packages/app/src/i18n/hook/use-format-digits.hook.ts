import { isNotEmptyString, isNumber } from '@rnw-community/shared';

import { useI18nContext } from '../context/i18n.context';

export const useFormatDigits = (minimumDecimalPlaces: number, maximumDecimalPlaces = minimumDecimalPlaces) => {
    const { intl } = useI18nContext();

    return (rawNumeric: string | number, symbol = '') => {
        if (isNumber(rawNumeric)) {
            const formatted = intl.formatNumber(rawNumeric, {
                style: 'decimal',
                minimumFractionDigits: minimumDecimalPlaces,
                maximumFractionDigits: maximumDecimalPlaces
            });

            return `${symbol}${formatted}`;
        }

        if (!isNotEmptyString(rawNumeric)) {
            return '';
        }

        const numericValue = Number.parseFloat(rawNumeric);

        if (Number.isNaN(numericValue)) {
            return '';
        }

        const formatted = intl.formatNumber(numericValue, {
            style: 'decimal',
            minimumFractionDigits: minimumDecimalPlaces,
            maximumFractionDigits: maximumDecimalPlaces
        });

        return `${symbol}${formatted}`;
    };
};
