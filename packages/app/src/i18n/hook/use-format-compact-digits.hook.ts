import { isNumber } from '@rnw-community/shared';

import { BILLION, HUNDRED_THOUSAND, MILLION, THOUSAND } from '../constant/compact-thresholds.constant';
import { useI18nContext } from '../context/i18n.context';

export const useFormatCompactDigits = () => {
    const { intl } = useI18nContext();

    return (value: number, symbol = '') => {
        if (!isNumber(value)) {
            return '';
        }

        const abs = Math.abs(value);
        const sign = value < 0 ? '-' : '';

        if (abs >= BILLION) {
            const formatted = intl.formatNumber(abs / BILLION, { maximumFractionDigits: 1 });

            return `${sign}${symbol}${formatted}B`;
        }

        if (abs >= MILLION) {
            const formatted = intl.formatNumber(abs / MILLION, { maximumFractionDigits: 1 });

            return `${sign}${symbol}${formatted}M`;
        }

        if (abs >= HUNDRED_THOUSAND) {
            const formatted = intl.formatNumber(abs / THOUSAND, { maximumFractionDigits: 0 });

            return `${sign}${symbol}${formatted}K`;
        }

        const formatted = intl.formatNumber(value, { maximumFractionDigits: 0 });

        return `${symbol}${formatted}`;
    };
};
