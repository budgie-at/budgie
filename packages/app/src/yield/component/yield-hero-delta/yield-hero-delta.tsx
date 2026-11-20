import { YieldDeltaKindEnum, YieldRangeEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../../@generic/hook/use-protected-amount-label.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { YIELD_TREND_ARROW } from '../../constant/yield-trend-arrow.constant';
import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldHeroTrendEnum } from '../../enum/yield-hero-trend.enum';
import { useYieldHeroTrend } from '../../hook/use-yield-hero-trend.hook';
import { PassiveIncomeSelector } from '../../selector/passive-income.selector';
import { YieldDeltaPill } from '../yield-delta-pill/yield-delta-pill';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
}

const LINE_MAX_FONT_SIZE_MULTIPLIER = 2;
const MIN_PRIOR_RATIO = 0.0001;

export const YieldHeroDelta = ({ summary }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { trend, tone, change } = useYieldHeroTrend(summary);
    const formatAmount = useProtectedAmountLabel();
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const ratio = summary.delta?.ratio ?? 0;
    const priorTotal = isDefined(summary.priorTotals)
        ? summary.priorTotals.reduce((sum, total) => sum + total, 0)
        : summary.earned.value / Math.max(1 + ratio, MIN_PRIOR_RATIO);
    const amount = formatAmount(Math.abs(summary.earned.value - priorTotal), symbol);

    const sign = trend === YieldHeroTrendEnum.DOWN ? '−' : '+';
    const comparisons: Record<YieldRangeEnum, string> = {
        [YieldRangeEnum.MONTH]: t`${sign}${amount} · ${sign}${change} vs previous month`,
        [YieldRangeEnum.QUARTER]: t`${sign}${amount} · ${sign}${change} vs previous 3 months`,
        [YieldRangeEnum.YEAR]: t`${sign}${amount} · ${sign}${change} vs previous year`,
        [YieldRangeEnum.ALL]: t`${sign}${amount} · ${sign}${change} vs previous period`
    };
    const comparison = summary.delta?.kind === YieldDeltaKindEnum.NEW ? t`New this period` : comparisons[screenKey.key.range];
    const label = `${YIELD_TREND_ARROW[trend]}${comparison}`;

    return (
        <YieldDeltaPill
            label={label}
            tone={tone}
            testID={PassiveIncomeSelector.Delta}
            maxFontSizeMultiplier={LINE_MAX_FONT_SIZE_MULTIPLIER}
        />
    );
};
