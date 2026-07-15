import { isNumber } from '@rnw-community/shared';

import { BILLION, HUNDRED_THOUSAND, MILLION, THOUSAND } from '../constant/compact-thresholds.constant';
import { useI18nContext } from '../context/i18n.context';

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

        if (absoluteValue < minimumCompactThreshold) {
            const formatted = intl.formatNumber(value, { maximumFractionDigits: 0 });

            return `${symbol}${formatted}`;
        }

        const sign = value < 0 ? '-' : '';
        const initialCompactDivisor = COMPACT_DIVISORS.find(compactDivisor => absoluteValue >= compactDivisor) ?? THOUSAND;
        const roundedCompactValue = Math.round((absoluteValue / initialCompactDivisor) * 10) / 10;
        const compactDivisor =
            roundedCompactValue >= THOUSAND && initialCompactDivisor < BILLION ? initialCompactDivisor * THOUSAND : initialCompactDivisor;
        const compactSuffix = COMPACT_SUFFIX_BY_DIVISOR.get(compactDivisor) ?? 'K';
        const promotedRoundedCompactValue = Math.round((absoluteValue / compactDivisor) * 10) / 10;
        const formatted = intl.formatNumber(promotedRoundedCompactValue, { maximumFractionDigits: 1 });

        return `${sign}${symbol}${formatted}${compactSuffix}`;
    };
};
