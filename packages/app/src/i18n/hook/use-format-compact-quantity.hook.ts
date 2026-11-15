import { isNotEmptyString } from '@rnw-community/shared';

import { useI18nContext } from '../context/i18n.context';
import { formatSymbolAmount } from '../utils/format-symbol-amount.util';

const WHOLE_UNIT_FRACTION_DIGITS = 2;
const SIGNIFICANT_FRACTION_DIGITS = 3;
const MAX_FRACTION_DIGITS = 8;

const getFractionDigits = (absolute: number): number =>
    absolute >= 1 || absolute === 0
        ? WHOLE_UNIT_FRACTION_DIGITS
        : Math.min(MAX_FRACTION_DIGITS, Math.ceil(-Math.log10(absolute)) + SIGNIFICANT_FRACTION_DIGITS);

export const useFormatCompactQuantity = () => {
    const { intl } = useI18nContext();

    return (amount: number, unit: string) => {
        const formatted = formatSymbolAmount(amount, '', absolute =>
            intl.formatNumber(absolute, { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: getFractionDigits(absolute) })
        );

        return isNotEmptyString(unit) ? `${formatted} ${unit}` : formatted;
    };
};
