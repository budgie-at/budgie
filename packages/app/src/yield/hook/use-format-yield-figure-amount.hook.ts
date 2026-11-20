import { useAtomValue } from '@effect/atom-react/Hooks';
import { useWindowDimensions } from 'react-native';

import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { HUNDRED_THOUSAND } from '../../i18n/constant/compact-thresholds.constant';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { YIELD_NARROW_WINDOW_WIDTH } from '../constant/yield-narrow-window-width.constant';

import { useFormatYieldCompactAmount } from './use-format-yield-compact-amount.hook';

export const useFormatYieldFigureAmount = () => {
    const { width } = useWindowDimensions();
    const isAmountProtected = useIsAmountProtected();
    const formatAmount = useProtectedAmountLabel();
    const formatCompact = useFormatYieldCompactAmount();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    return (amount: number): string =>
        width <= YIELD_NARROW_WINDOW_WIDTH && !isAmountProtected && Math.abs(amount) >= HUNDRED_THOUSAND
            ? formatCompact(amount, symbol)
            : formatAmount(amount, symbol);
};
