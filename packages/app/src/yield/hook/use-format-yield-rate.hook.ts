import { useI18nContext } from '../../i18n/context/i18n.context';

const RATE_FRACTION_DIGITS = 1;

export const useFormatYieldRate = () => {
    const { intl } = useI18nContext();

    return (rate: number) =>
        intl.formatNumber(rate, {
            style: 'percent',
            minimumFractionDigits: RATE_FRACTION_DIGITS,
            maximumFractionDigits: RATE_FRACTION_DIGITS
        });
};
