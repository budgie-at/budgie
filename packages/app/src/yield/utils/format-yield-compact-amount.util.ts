import { BILLION, MILLION, THOUSAND, TRILLION } from '../../i18n/constant/compact-thresholds.constant';

const SUFFIX_BY_DIVISOR = new Map<number, string>([
    [THOUSAND, 'K'],
    [MILLION, 'M'],
    [BILLION, 'B'],
    [TRILLION, 'T']
]);
const TWO_DECIMALS_BELOW = 10;
const ONE_DECIMAL_BELOW = 100;

const resolveDigits = (scaled: number, divisor: number): number => {
    if (divisor === 1) {
        return 0;
    }

    if (scaled < TWO_DECIMALS_BELOW) {
        return 2;
    }

    return scaled < ONE_DECIMAL_BELOW ? 1 : 0;
};

export const formatYieldCompactAmount = (
    value: number,
    divisor: number,
    symbol: string,
    formatNumber: (absolute: number, maximumFractionDigits: number) => string
): string => {
    const sign = value < 0 ? '-' : '';
    const scaled = Math.abs(value) / divisor;
    const suffix = SUFFIX_BY_DIVISOR.get(divisor) ?? '';
    const digits = resolveDigits(scaled, divisor);

    return `${sign}${symbol}${formatNumber(scaled, digits)}${suffix}`;
};
