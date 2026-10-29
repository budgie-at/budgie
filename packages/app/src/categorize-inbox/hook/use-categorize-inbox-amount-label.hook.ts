import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { decimalPlacesAtom } from '../../settings/constants/settings-atoms.constant';

const MINOR_UNIT_DECIMAL_PLACES = 2;
const MINOR_UNIT_THRESHOLD = 100;

export const useCategorizeInboxAmountLabel = (): ((microAmount: number, symbol: string) => string) => {
    const isAmountProtected = useIsAmountProtected();
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const formatWhole = useFormatDigits(decimalPlaces);
    const formatMinor = useFormatDigits(Math.max(decimalPlaces, MINOR_UNIT_DECIMAL_PLACES));

    return (microAmount, symbol) => {
        if (isAmountProtected) {
            return PROTECTED_AMOUNT_PLACEHOLDER;
        }

        const amount = convertFromMicroUnits(microAmount);

        return Math.abs(amount) < MINOR_UNIT_THRESHOLD ? formatMinor(amount, symbol) : formatWhole(amount, symbol);
    };
};
