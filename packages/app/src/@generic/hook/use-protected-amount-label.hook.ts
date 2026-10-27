import { useAtomValue } from '@effect/atom-react/Hooks';

import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';
import { PROTECTED_AMOUNT_PLACEHOLDER } from '../constant/protected-amount-placeholder.constant';

import { useIsAmountProtected } from './use-is-amount-protected.hook';

export const useProtectedAmountLabel = (): ((amount: number, instrumentSymbol?: string) => string) => {
    const isAmountProtected = useIsAmountProtected();
    const formatDigits = useFormatDigits(useAtomValue(decimalPlacesAtom));

    return (amount: number, instrumentSymbol = '') =>
        isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatDigits(amount, instrumentSymbol);
};
