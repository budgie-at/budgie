import { useLingui } from '@lingui/react/macro';

import { BILLION, MILLION, THOUSAND, TRILLION } from '../../i18n/constant/compact-thresholds.constant';

export const useYieldCompactSuffix = () => {
    const { t } = useLingui();

    const suffixes = new Map<number, string>([
        [THOUSAND, t({ message: 'K', context: 'compact number suffix', comment: 'Compact suffix for thousands in amounts, e.g. $1.5K' })],
        [MILLION, t({ message: 'M', context: 'compact number suffix', comment: 'Compact suffix for millions in amounts, e.g. $1.5M' })],
        [BILLION, t({ message: 'B', context: 'compact number suffix', comment: 'Compact suffix for billions in amounts, e.g. $1.5B' })],
        [TRILLION, t({ message: 'T', context: 'compact number suffix', comment: 'Compact suffix for trillions in amounts, e.g. $1.5T' })]
    ]);

    return (divisor: number): string => suffixes.get(divisor) ?? '';
};
