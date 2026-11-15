import { isNotEmptyString } from '@rnw-community/shared';

import { useI18nContext } from '../context/i18n.context';
import { formatSymbolAmount } from '../utils/format-symbol-amount.util';

const SIGNIFICANT_DIGITS = 6;
const SUB_UNIT_SIGNIFICANT_FRACTION_DIGITS = 3;
const MAX_FRACTION_DIGITS = 8;

const getFractionDigits = (absolute: number): number => {
    if (absolute === 0) {
        return 0;
    }

    const fractionDigits =
        absolute >= 1
            ? SIGNIFICANT_DIGITS - Math.floor(Math.log10(absolute)) - 1
            : Math.ceil(-Math.log10(absolute)) + SUB_UNIT_SIGNIFICANT_FRACTION_DIGITS;

    return Math.min(MAX_FRACTION_DIGITS, Math.max(0, fractionDigits));
};

export const useFormatCompactQuantity = () => {
    const { intl } = useI18nContext();

    return (amount: number, unit: string) => {
        const formatted = formatSymbolAmount(amount, '', absolute =>
            intl.formatNumber(absolute, { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: getFractionDigits(absolute) })
        );

        return isNotEmptyString(unit) ? `${formatted} ${unit}` : formatted;
    };
};
