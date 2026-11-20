import { useAtomValue } from '@effect/atom-react/Hooks';

import { useIsAmountProtected } from '../../@generic/hook/use-is-amount-protected.hook';
import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { MILLION } from '../../i18n/constant/compact-thresholds.constant';
import { useFormatCompactDigits } from '../../i18n/hook/use-format-compact-digits.hook';
import { useFormatPercent } from '../../i18n/hook/use-format-percent.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

export const useYieldLegendAmounts = (total: number, share: number, isShare: boolean) => {
    const isAmountProtected = useIsAmountProtected();
    const formatAmount = useProtectedAmountLabel();
    const formatCompact = useFormatCompactDigits(MILLION);
    const formatPercent = useFormatPercent();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const exact = formatAmount(total, symbol);

    const compact = isAmountProtected ? exact : formatCompact(total, symbol);

    return { exact, shown: isShare ? formatPercent(share) : compact };
};
