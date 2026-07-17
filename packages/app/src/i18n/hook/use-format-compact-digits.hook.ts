import { isDefined, isNumber } from '@rnw-community/shared';

import { BILLION, HUNDRED_THOUSAND, MILLION, THOUSAND } from '../constant/compact-thresholds.constant';
import { useI18nContext } from '../context/i18n.context';

const COMPACT_DIVISORS = [BILLION, MILLION, THOUSAND] as const;
const COMPACT_SUFFIX_BY_DIVISOR = new Map<number, string>([
    [THOUSAND, 'K'],
    [MILLION, 'M'],
    [BILLION, 'B']
]);

export const useFormatCompactDigits = (minimumCompactThreshold?: number) => {
    const { intl } = useI18nContext();

    if (!isDefined(minimumCompactThreshold)) {
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
    }

    return (value: number, symbol = '') => {
        if (!isNumber(value)) {
            return '';
        }

        const absoluteValue = Math.abs(value);

        if (!Number.isFinite(value) || absoluteValue < minimumCompactThreshold) {
            const formatted = intl.formatNumber(value, { maximumFractionDigits: 0 });

            return `${symbol}${formatted}`;
        }

        const sign = value < 0 ? '-' : '';
        const initialCompactDivisor = COMPACT_DIVISORS.find(compactDivisor => absoluteValue >= compactDivisor) ?? THOUSAND;
        const roundedCompactValue = Math.round((absoluteValue / initialCompactDivisor) * 10) / 10;
        const compactDivisor =
            roundedCompactValue >= THOUSAND && initialCompactDivisor < BILLION ? initialCompactDivisor * THOUSAND : initialCompactDivisor;
        const compactSuffix = COMPACT_SUFFIX_BY_DIVISOR.get(compactDivisor) ?? 'K';
        const compactValue = Math.round((absoluteValue / compactDivisor) * 10) / 10;
        const formatted = intl.formatNumber(compactValue, { maximumFractionDigits: 1 });

        return `${sign}${symbol}${formatted}${compactSuffix}`;
    };
};
