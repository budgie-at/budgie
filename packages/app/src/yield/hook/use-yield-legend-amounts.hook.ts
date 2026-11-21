import { useAtomValue } from '@effect/atom-react/Hooks';

import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { useFormatPercent } from '../../i18n/hook/use-format-percent.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { formatYieldCompactAmount } from '../utils/format-yield-compact-amount.util';

import { useFormatYieldNumber } from './use-format-yield-number.hook';

const EMPTY_AMOUNT = '—';

export const useYieldLegendAmounts = (total: number, share: number, isCompact: boolean, isEmpty = false) => {
    const isAmountProtected = useIsAmountProtected();
    const formatAmount = useProtectedAmountLabel();
    const formatNumber = useFormatYieldNumber();
    const formatPercent = useFormatPercent();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const exact = isEmpty ? EMPTY_AMOUNT : formatAmount(total, symbol);
    const compact = isAmountProtected || isEmpty || !isCompact ? exact : formatYieldCompactAmount(total, symbol, formatNumber);

    return { exact, amount: compact, share: formatPercent(share) };
};
