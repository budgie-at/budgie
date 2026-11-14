import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { YIELD_UNAVAILABLE_LABEL } from '../constant/yield-unavailable-label.constant';

import { useFormatYieldRate } from './use-format-yield-rate.hook';

import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldEntrySubtitle = (
    summary: Pick<YieldSummaryInterface, 'annualYield' | 'earned' | 'positions'> | null,
    isAccount: boolean
): string => {
    const { t } = useLingui();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const formatAmount = useProtectedAmountLabel();
    const formatRate = useFormatYieldRate();

    const yieldRate = summary?.annualYield.rate ?? null;
    const yieldReason = summary?.annualYield.reason ?? null;
    const accruing = isAccount ? (summary?.positions.at(0)?.accruing ?? null) : null;
    const earned = formatAmount(summary?.earned.value ?? 0, symbol);
    const formattedRate = isDefined(yieldRate) ? formatRate(yieldRate) : '';
    const unavailable = isDefined(yieldReason) ? t(YIELD_UNAVAILABLE_LABEL[yieldReason]) : '—';
    const yieldText = isDefined(yieldRate) ? t`${formattedRate} a year` : unavailable;
    const accruingAmount = formatAmount(accruing ?? 0, symbol);

    return isDefined(accruing) ? t`Accruing ${accruingAmount}` : t`${earned} past year · ${yieldText}`;
};
