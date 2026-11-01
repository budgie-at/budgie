import { useI18nContext } from '../context/i18n.context';

const SMALLEST_VISIBLE_SHARE = 0.001;
const ONE_DECIMAL_THRESHOLD = 0.1;

export const useFormatPercent = () => {
    const { intl } = useI18nContext();

    const formatShare = (share: number) => {
        const fractionDigits = Math.abs(share) < ONE_DECIMAL_THRESHOLD ? 1 : 0;

        return intl.formatNumber(share, { style: 'percent', minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
    };

    return (share: number) => {
        const isBelowVisibleShare = share > 0 && share < SMALLEST_VISIBLE_SHARE;

        return isBelowVisibleShare ? `<${formatShare(SMALLEST_VISIBLE_SHARE)}` : formatShare(share);
    };
};
