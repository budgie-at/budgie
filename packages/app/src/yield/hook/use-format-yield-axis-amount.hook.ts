import { useI18nContext } from '../../i18n/context/i18n.context';
import { formatYieldAxisAmount } from '../utils/format-yield-axis-amount.util';

export const useFormatYieldAxisAmount = () => {
    const { intl } = useI18nContext();

    return (value: number, symbol: string) =>
        formatYieldAxisAmount(value, symbol, (absolute, fractionDigits) =>
            intl.formatNumber(absolute, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
        );
};
