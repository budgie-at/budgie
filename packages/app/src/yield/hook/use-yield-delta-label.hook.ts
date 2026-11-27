import { YieldRangeEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { decimalPlacesAtom, defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { YIELD_TREND_ARROW } from '../constant/yield-trend-arrow.constant';
import { YieldDeltaToneEnum } from '../enum/yield-delta-tone.enum';
import { YieldHeroTrendEnum } from '../enum/yield-hero-trend.enum';
import { buildYieldDeltaChange } from '../utils/build-yield-delta-change.util';

import { useYieldComparisonPhrase } from './use-yield-comparison-phrase.hook';
import { useYieldHeroTrend } from './use-yield-hero-trend.hook';

import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldDeltaLabel = (
    summary: Pick<YieldSummaryInterface, 'delta' | 'earned' | 'priorTotals'> | null,
    range: YieldRangeEnum
) => {
    const { t } = useLingui();
    const { trend, tone, change } = useYieldHeroTrend(summary);
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const decimalPlaces = useAtomValue(decimalPlacesAtom);

    const { roundedChange, isNew, isZeroChange } = buildYieldDeltaChange(summary, decimalPlaces);
    const amount = formatAmount(roundedChange, symbol);

    const resolvedTone = isZeroChange ? YieldDeltaToneEnum.NEUTRAL : tone;
    const resolvedTrend = isZeroChange ? YieldHeroTrendEnum.NONE : trend;
    const sign = resolvedTrend === YieldHeroTrendEnum.DOWN ? '−' : '+';
    const comparison = useYieldComparisonPhrase(range, resolvedTone);
    const changeLabel =
        resolvedTone === YieldDeltaToneEnum.NEUTRAL
            ? `${sign}${change} ·`
            : `${YIELD_TREND_ARROW[resolvedTrend]}${t`${sign}${amount} · ${sign}${change}`}`;
    const label = isNew ? t`New this period` : changeLabel;

    return { label, caption: isNew ? '' : comparison, trend: resolvedTrend, tone: resolvedTone };
};
