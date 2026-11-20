import { useI18nContext } from '../../i18n/context/i18n.context';
import { formatYieldCompactAmount } from '../utils/format-yield-compact-amount.util';

export const useFormatYieldCompactAmount = () => {
    const { intl } = useI18nContext();

    return (value: number, symbol: string) =>
        formatYieldCompactAmount(value, symbol, (absolute, fractionDigits) =>
            intl.formatNumber(absolute, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
        );
};
