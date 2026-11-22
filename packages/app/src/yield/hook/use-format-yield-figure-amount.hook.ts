import { useAtomValue } from '@effect/atom-react/Hooks';
import { useWindowDimensions } from 'react-native';

import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { HUNDRED_THOUSAND } from '../../i18n/constant/compact-thresholds.constant';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { formatYieldCompactAmount } from '../utils/format-yield-compact-amount.util';

import { useFormatYieldNumber } from './use-format-yield-number.hook';

const YIELD_NARROW_WINDOW_WIDTH = 375;

export const useFormatYieldFigureAmount = () => {
    const { width } = useWindowDimensions();
    const isAmountProtected = useIsAmountProtected();
    const formatAmount = useProtectedAmountLabel();
    const formatNumber = useFormatYieldNumber();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    return (amount: number): string =>
        width <= YIELD_NARROW_WINDOW_WIDTH && !isAmountProtected && Math.abs(amount) >= HUNDRED_THOUSAND
            ? formatYieldCompactAmount(amount, symbol, formatNumber)
            : formatAmount(amount, symbol);
};
