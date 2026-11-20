import { BILLION, MILLION, THOUSAND, TRILLION } from '../../i18n/constant/compact-thresholds.constant';

export const YIELD_COMPACT_SUFFIX_BY_DIVISOR = new Map<number, string>([
    [THOUSAND, 'K'],
    [MILLION, 'M'],
    [BILLION, 'B'],
    [TRILLION, 'T']
]);
