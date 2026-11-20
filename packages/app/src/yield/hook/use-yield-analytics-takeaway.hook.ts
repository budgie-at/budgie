import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';

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
        return `+${change} ${priorLabels[range]}`;
    }

    return trend === YieldHeroTrendEnum.DOWN ? `−${change} ${priorLabels[range]}` : null;
};
