import { YieldDeltaKindEnum, YieldRangeEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { decimalPlacesAtom, defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { YIELD_TREND_ARROW } from '../constant/yield-trend-arrow.constant';
import { YieldHeroTrendEnum } from '../enum/yield-hero-trend.enum';
import { roundYieldDelta } from '../utils/round-yield-delta.util';

import { useYieldHeroTrend } from './use-yield-hero-trend.hook';

import type { YieldSummaryInterface } from '@budgie/market';

const MIN_PRIOR_RATIO = 0.0001;

export const useYieldDeltaLabel = (
    summary: Pick<YieldSummaryInterface, 'delta' | 'earned' | 'priorTotals'> | null,
    range: YieldRangeEnum
) => {
    const { t } = useLingui();
    const { trend, tone, change } = useYieldHeroTrend(summary);
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const decimalPlaces = useAtomValue(decimalPlacesAtom);

    const ratio = summary?.delta?.ratio ?? 0;
    const earned = summary?.earned.value ?? 0;
    const priorTotals = summary?.priorTotals ?? null;
    const priorTotal = isDefined(priorTotals)
        ? priorTotals.reduce((sum, total) => sum + total, 0)
        : earned / Math.max(1 + ratio, MIN_PRIOR_RATIO);
    const amount = formatAmount(Math.abs(roundYieldDelta(earned, priorTotal, decimalPlaces)), symbol);

    const sign = trend === YieldHeroTrendEnum.DOWN ? '−' : '+';
    const comparisons: Record<YieldRangeEnum, string> = {
        [YieldRangeEnum.MONTH]: t`${sign}${amount} · ${sign}${change} vs previous 30 days`,
        [YieldRangeEnum.QUARTER]: t`${sign}${amount} · ${sign}${change} vs previous 3 months`,
        [YieldRangeEnum.YEAR]: t`${sign}${amount} · ${sign}${change} vs previous year`,
        [YieldRangeEnum.ALL]: t`${sign}${amount} · ${sign}${change} vs previous period`
    };
    const comparison = summary?.delta?.kind === YieldDeltaKindEnum.NEW ? t`New this period` : comparisons[range];

    return { label: `${YIELD_TREND_ARROW[trend]}${comparison}`, trend, tone };
};
