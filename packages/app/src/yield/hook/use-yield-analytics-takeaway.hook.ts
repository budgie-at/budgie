import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';

import { YIELD_TREND_ARROW } from '../constant/yield-trend-arrow.constant';
import { YieldHeroTrendEnum } from '../enum/yield-hero-trend.enum';

import { useYieldHeroTrend } from './use-yield-hero-trend.hook';

import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldAnalyticsTakeaway = (
    summary: Pick<YieldSummaryInterface, 'delta' | 'earned'> | null,
    range: YieldRangeEnum
): string | null => {
    const { t } = useLingui();
    const { trend, change } = useYieldHeroTrend(summary);

    const priorLabels: Record<YieldRangeEnum, string> = {
        [YieldRangeEnum.MONTH]: t`vs previous month`,
        [YieldRangeEnum.QUARTER]: t`vs previous 3 months`,
        [YieldRangeEnum.YEAR]: t`vs previous year`,
        [YieldRangeEnum.ALL]: t`vs previous period`
    };

    if (trend === YieldHeroTrendEnum.UP) {
        return `${YIELD_TREND_ARROW[trend]}+${change} ${priorLabels[range]}`;
    }

    return trend === YieldHeroTrendEnum.DOWN ? `${YIELD_TREND_ARROW[trend]}−${change} ${priorLabels[range]}` : null;
};
