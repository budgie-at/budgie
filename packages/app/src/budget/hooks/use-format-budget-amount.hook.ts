import { useDisplayFormatDigits } from '../../i18n/hook/use-display-format-digits.hook';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';

const WHOLE_UNITS_THRESHOLD = 100;

export const useFormatBudgetAmount = () => {
    const formatWhole = useFormatDigits(0);
    const formatDisplay = useDisplayFormatDigits();

    return (amount: number, currencySymbol: string) =>
        Math.abs(amount) >= WHOLE_UNITS_THRESHOLD ? formatWhole(amount, currencySymbol) : formatDisplay(amount, currencySymbol);
};
