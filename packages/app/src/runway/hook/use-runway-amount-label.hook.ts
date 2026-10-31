import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

export const useRunwayAmountLabel = (): ((microAmount: number) => string) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const isAmountProtected = useIsAmountProtected();
    const formatWholeDigits = useFormatDigits(0);

    return (microAmount: number) =>
        isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : formatWholeDigits(convertFromMicroUnits(microAmount), defaultInstrument.symbol);
};
