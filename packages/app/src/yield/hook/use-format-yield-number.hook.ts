import { useI18nContext } from '../../i18n/context/i18n.context';

export const useFormatYieldNumber = () => {
    const { intl } = useI18nContext();

    return (absolute: number, fractionDigits: number) =>
        intl.formatNumber(absolute, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
};
