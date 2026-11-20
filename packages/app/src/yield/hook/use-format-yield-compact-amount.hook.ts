import { useI18nContext } from '../../i18n/context/i18n.context';
import { formatYieldCompactAmount } from '../utils/format-yield-compact-amount.util';

export const useFormatYieldCompactAmount = () => {
    const { intl } = useI18nContext();

    return (value: number, divisor: number, symbol: string) =>
        formatYieldCompactAmount(value, divisor, symbol, (absolute, maximumFractionDigits) =>
            intl.formatNumber(absolute, { maximumFractionDigits })
        );
};
