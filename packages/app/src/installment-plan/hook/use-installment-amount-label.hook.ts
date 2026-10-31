import { convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';

export const useInstallmentAmountLabel = () => {
    const isAmountProtected = useIsAmountProtected();
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatWholeAmount = useFormatDigits(decimalPlaces);
    const formatFractionalAmount = useFormatDigits(Math.max(decimalPlaces, DEFAULT_DECIMAL_PLACES));

    return (microAmount: number, instrumentSymbol: string, isFractional = microAmount % convertToMicroUnits(1) !== 0) => {
        if (isAmountProtected) {
            return PROTECTED_AMOUNT_PLACEHOLDER;
        }

        const amount = convertFromMicroUnits(microAmount);

        return isFractional ? formatFractionalAmount(amount, instrumentSymbol) : formatWholeAmount(amount, instrumentSymbol);
    };
};
