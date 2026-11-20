import { useAtomValue } from '@effect/atom-react/Hooks';
import { useWindowDimensions } from 'react-native';

import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { HUNDRED_THOUSAND } from '../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../i18n/hook/use-format-compact-digits.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { YIELD_NARROW_WINDOW_WIDTH } from '../constant/yield-narrow-window-width.constant';

export const useFormatYieldHoldingAmount = () => {
    const { width } = useWindowDimensions();
    const isAmountProtected = useIsAmountProtected();
    const formatAmount = useProtectedAmountLabel();
    const formatCompact = useFormatCompactDigits(HUNDRED_THOUSAND);
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    return (amount: number): string =>
        width <= YIELD_NARROW_WINDOW_WIDTH && !isAmountProtected ? formatCompact(amount, symbol) : formatAmount(amount, symbol);
};
