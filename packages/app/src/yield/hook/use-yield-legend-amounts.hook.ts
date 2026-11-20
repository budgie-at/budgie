import { useAtomValue } from '@effect/atom-react/Hooks';

import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { useFormatPercent } from '../../i18n/hook/use-format-percent.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

import { useFormatYieldCompactAmount } from './use-format-yield-compact-amount.hook';

const EMPTY_AMOUNT = '—';

export const useYieldLegendAmounts = (total: number, share: number, divisor: number, isEmpty = false) => {
    const isAmountProtected = useIsAmountProtected();
    const formatAmount = useProtectedAmountLabel();
    const formatCompact = useFormatYieldCompactAmount();
    const formatPercent = useFormatPercent();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const exact = isEmpty ? EMPTY_AMOUNT : formatAmount(total, symbol);
    const compact = isAmountProtected || isEmpty ? exact : formatCompact(total, divisor, symbol);

    return { exact, amount: compact, share: formatPercent(share) };
};
