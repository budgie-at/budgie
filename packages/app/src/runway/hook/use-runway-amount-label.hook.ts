import { convertFromMicroUnits } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';

import { PROTECTED_AMOUNT_PLACEHOLDER } from '../../@generic/constant/protected-amount-placeholder.constant';
import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { HUNDRED_THOUSAND } from '../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../i18n/hook/use-format-compact-digits.hook';
import { useFormatDigits } from '../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

export const useRunwayAmountLabel = (compactFrom = HUNDRED_THOUSAND): ((microAmount: number) => string) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const isAmountProtected = useIsAmountProtected();
    const formatWholeDigits = useFormatDigits(0);
    const formatCompactDigits = useFormatCompactDigits(compactFrom);

    return (microAmount: number) => {
        const amount = convertFromMicroUnits(microAmount);
        const format = Math.abs(amount) >= compactFrom ? formatCompactDigits : formatWholeDigits;

        return isAmountProtected ? PROTECTED_AMOUNT_PLACEHOLDER : format(amount, defaultInstrument.symbol).replaceAll('-', '−');
    };
};
