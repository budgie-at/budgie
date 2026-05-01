import { isNumber } from '@rnw-community/shared';

import { useI18nContext } from '../context/i18n.context';

export const useFormatCompactDigits = () => {
    const { intl } = useI18nContext();

    return (value: number, symbol = '') => {
        if (!isNumber(value)) {
            return '';
        }

        const abs = Math.abs(value);
        const sign = value < 0 ? '-' : '';

        if (abs >= 1e9) {
            const formatted = intl.formatNumber(abs / 1e9, { maximumFractionDigits: 1 });

            return `${sign}${symbol}${formatted}B`;
        }

        if (abs >= 1e6) {
            const formatted = intl.formatNumber(abs / 1e6, { maximumFractionDigits: 1 });

            return `${sign}${symbol}${formatted}M`;
        }

        if (abs >= 1e5) {
            const formatted = intl.formatNumber(abs / 1e3, { maximumFractionDigits: 0 });

            return `${sign}${symbol}${formatted}K`;
        }

        const formatted = intl.formatNumber(value, { maximumFractionDigits: 0 });

        return `${symbol}${formatted}`;
    };
};
