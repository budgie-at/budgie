import { BILLION, MILLION, THOUSAND, TRILLION } from '../../i18n/constant/compact-thresholds.constant';

const DIVISORS = [TRILLION, BILLION, MILLION, THOUSAND] as const;
const ROLLOVER = 999.5;

export const pickYieldCompactDivisor = (maxAbsolute: number, threshold: number): number => {
    if (!Number.isFinite(maxAbsolute) || maxAbsolute < threshold) {
        return 1;
    }

    const divisor = DIVISORS.find(candidate => maxAbsolute >= candidate) ?? THOUSAND;

    return maxAbsolute / divisor >= ROLLOVER && divisor < TRILLION ? divisor * THOUSAND : divisor;
};
