import { isNumber } from '@rnw-community/shared';

import { BILLION, HUNDRED_THOUSAND, MILLION, THOUSAND } from '../constant/compact-thresholds.constant';
import { useI18nContext } from '../context/i18n.context';
import { formatSymbolAmount } from '../utils/format-symbol-amount.util';

const COMPACT_DIVISORS = [BILLION, MILLION, THOUSAND] as const;
const COMPACT_SUFFIX_BY_DIVISOR = new Map<number, string>([
    [THOUSAND, 'K'],
    [MILLION, 'M'],
    [BILLION, 'B']
]);

export const useFormatCompactDigits = (minimumCompactThreshold = HUNDRED_THOUSAND) => {
    const { intl } = useI18nContext();

    return (value: number, symbol = '') => {
        if (!isNumber(value)) {
            return '';
        }

        const absoluteValue = Math.abs(value);

        if (!Number.isFinite(value) || absoluteValue < minimumCompactThreshold) {
            return formatSymbolAmount(value, symbol, absolute => intl.formatNumber(absolute, { maximumFractionDigits: 0 }));
        }

        const sign = value < 0 ? '-' : '';
        const initialCompactDivisor = COMPACT_DIVISORS.find(compactDivisor => absoluteValue >= compactDivisor) ?? THOUSAND;
        const roundedCompactValue = Math.round((absoluteValue / initialCompactDivisor) * 10) / 10;
        const compactDivisor =
            roundedCompactValue >= THOUSAND && initialCompactDivisor < BILLION ? initialCompactDivisor * THOUSAND : initialCompactDivisor;
        const compactSuffix = COMPACT_SUFFIX_BY_DIVISOR.get(compactDivisor) ?? 'K';
        const maximumFractionDigits = compactSuffix === 'K' && minimumCompactThreshold >= HUNDRED_THOUSAND ? 0 : 1;
        const formatted = intl.formatNumber(absoluteValue / compactDivisor, { maximumFractionDigits });

        return `${sign}${symbol}${formatted}${compactSuffix}`;
    };
};
