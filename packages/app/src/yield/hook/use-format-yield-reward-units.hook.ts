import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { useI18nContext } from '../../i18n/context/i18n.context';

const SMALL_UNITS_LIMIT = 10;
const SMALL_UNITS_SIGNIFICANT_DIGITS = 2;

export const useFormatYieldRewardUnits = () => {
    const { intl } = useI18nContext();
    const isAmountProtected = useIsAmountProtected();
    const formatAmount = useProtectedAmountLabel();

    return (units: number): string => {
        if (units >= SMALL_UNITS_LIMIT) {
            return formatAmount(units);
        }

        return isAmountProtected
            ? PROTECTED_AMOUNT_PLACEHOLDER
            : intl.formatNumber(units, { maximumSignificantDigits: SMALL_UNITS_SIGNIFICANT_DIGITS });
    };
};
