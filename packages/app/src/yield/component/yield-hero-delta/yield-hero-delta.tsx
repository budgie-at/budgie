import { YieldDeltaKindEnum, YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

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

export const YieldHeroDelta = ({ summary }: Props) => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { trend, tone, change } = useYieldHeroTrend(summary);

    const sign = trend === YieldHeroTrendEnum.DOWN ? '−' : '+';
    const comparisons: Record<YieldRangeEnum, string> = {
        [YieldRangeEnum.MONTH]: t`${sign}${change} vs previous month`,
        [YieldRangeEnum.QUARTER]: t`${sign}${change} vs previous 3 months`,
        [YieldRangeEnum.YEAR]: t`${sign}${change} vs previous year`,
        [YieldRangeEnum.ALL]: t`${sign}${change} vs previous period`
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
