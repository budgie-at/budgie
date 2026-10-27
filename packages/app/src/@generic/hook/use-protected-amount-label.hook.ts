import { useDisplayFormatDigits } from '../../i18n/hook/use-display-format-digits.hook';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../constant/protected-amount-placeholder.constant';

import { useIsAmountProtected } from './use-is-amount-protected.hook';

export const useProtectedAmountLabel = (): ((amount: number, instrumentSymbol?: string) => string) => {
    const isAmountProtected = useIsAmountProtected();
    const formatDigits = useDisplayFormatDigits();

    return (amount: number, instrumentSymbol = '') =>
        isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatDigits(amount, instrumentSymbol);
};
