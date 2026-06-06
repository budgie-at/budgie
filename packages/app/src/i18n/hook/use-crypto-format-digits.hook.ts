import { isNotEmptyString, isNumber } from '@rnw-community/shared';

import { MICRO_UNIT_DECIMAL_PLACES } from '../../@generic/constant/micro-unit-decimal-places.constant';
import { useI18nContext } from '../context/i18n.context';

export const useCryptoFormatDigits = () => {
    const { intl } = useI18nContext();

    return (rawNumeric: string | number, symbol = '') => {
        if (isNumber(rawNumeric)) {
            const formatted = intl.formatNumber(rawNumeric, {
                style: 'decimal',
                minimumFractionDigits: 0,
                maximumFractionDigits: MICRO_UNIT_DECIMAL_PLACES
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
            minimumFractionDigits: 0,
            maximumFractionDigits: MICRO_UNIT_DECIMAL_PLACES
        });

        return `${symbol}${formatted}`;
    };
};
