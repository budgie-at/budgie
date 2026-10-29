import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../constant/protected-amount-placeholder.constant';

import { useIsAmountProtected } from './use-is-amount-protected.hook';

export const useProtectedWholeAmountLabel = (): ((amount: number, instrumentSymbol?: string) => string) => {
    const isAmountProtected = useIsAmountProtected();
    const formatDigits = useFormatDigits(0);

    return (amount: number, instrumentSymbol = '') =>
        isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatDigits(Math.round(amount), instrumentSymbol);
};
