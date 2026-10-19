import { isNotEmptyString, isNumber } from '@rnw-community/shared';

import { useI18nContext } from '../context/i18n.context';
import { formatSymbolAmount } from '../utils/format-symbol-amount.util';

export const useFormatDigits = (minimumDecimalPlaces: number, maximumDecimalPlaces = minimumDecimalPlaces) => {
    const { intl } = useI18nContext();

    const formatNumeric = (value: number, symbol: string) =>
        formatSymbolAmount(
            intl.formatNumberToParts(value, {
                style: 'decimal',
                minimumFractionDigits: minimumDecimalPlaces,
                maximumFractionDigits: maximumDecimalPlaces
            }),
            symbol
        );

    return (rawNumeric: string | number, symbol = '') => {
        if (isNumber(rawNumeric)) {
            return formatNumeric(rawNumeric, symbol);
        }

        if (!isNotEmptyString(rawNumeric)) {
            return '';
        }

        const numericValue = Number.parseFloat(rawNumeric);

        return Number.isNaN(numericValue) ? '' : formatNumeric(numericValue, symbol);
    };
};
