import { THOUSAND } from '../../i18n/constant/compact-thresholds.constant';
import { YIELD_COMPACT_SUFFIX_BY_DIVISOR } from '../constant/yield-compact-suffix.constant';

import { pickYieldCompactDivisor } from './pick-yield-compact-divisor.util';

const TWO_DECIMALS_BELOW = 10;
const ONE_DECIMAL_BELOW = 100;

const resolveDigits = (scaled: number, divisor: number): number => {
    if (divisor === 1) {
        return Number.isInteger(scaled) || scaled >= TWO_DECIMALS_BELOW ? 0 : 2;
    }

    if (scaled < TWO_DECIMALS_BELOW) {
        return 2;
    }

    return scaled < ONE_DECIMAL_BELOW ? 1 : 0;
};

export const formatYieldCompactAmount = (
    value: number,
    symbol: string,
    formatNumber: (absolute: number, fractionDigits: number) => string
): string => {
    const absolute = Math.abs(value);
    const divisor = pickYieldCompactDivisor(absolute, THOUSAND);
    const scaled = absolute / divisor;
    const sign = value < 0 ? '−' : '';
    const suffix = YIELD_COMPACT_SUFFIX_BY_DIVISOR.get(divisor) ?? '';

    return `${sign}${symbol}${formatNumber(scaled, resolveDigits(scaled, divisor))}${suffix}`;
};
