import { YieldDeltaKindEnum } from '@budgie/market';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatPercent } from '../../i18n/hook/use-format-percent.hook';
import { YieldHeroTrendEnum } from '../enum/yield-hero-trend.enum';

import type { YieldDeltaInterface, YieldSummaryInterface } from '@budgie/market';

const resolveTrend = (delta: YieldDeltaInterface | null): YieldHeroTrendEnum => {
    if (!isDefined(delta)) {
        return YieldHeroTrendEnum.NONE;
    }

    if (delta.kind === YieldDeltaKindEnum.NEW) {
        return YieldHeroTrendEnum.NEW;
    }

    const ratio = delta.ratio ?? 0;

    if (ratio === 0) {
        return YieldHeroTrendEnum.NONE;
    }

    return isPositiveNumber(ratio) ? YieldHeroTrendEnum.UP : YieldHeroTrendEnum.DOWN;
};

export const useYieldHeroTrend = (summary: Pick<YieldSummaryInterface, 'delta' | 'earned'> | null) => {
    const formatPercent = useFormatPercent();

    const delta = summary?.delta ?? null;

    return {
        trend: resolveTrend(delta),
        change: formatPercent(Math.abs(delta?.ratio ?? 0)),
        isEstimated: summary?.earned.isEstimated === true
    };
};
