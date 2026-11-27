import { YieldDeltaKindEnum } from '@budgie/market';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatPercent } from '../../i18n/hook/use-format-percent.hook';
import { YIELD_NEUTRAL_RATIO } from '../constant/yield-neutral-ratio.constant';
import { YieldDeltaToneEnum } from '../enum/yield-delta-tone.enum';
import { YieldHeroTrendEnum } from '../enum/yield-hero-trend.enum';

import type { YieldDeltaInterface, YieldSummaryInterface } from '@budgie/market';

const resolveTone = (delta: YieldDeltaInterface | null): YieldDeltaToneEnum => {
    const ratio = delta?.ratio ?? 0;

    if (delta?.kind !== YieldDeltaKindEnum.NEW && Math.abs(ratio) < YIELD_NEUTRAL_RATIO) {
        return YieldDeltaToneEnum.NEUTRAL;
    }

    return ratio < 0 ? YieldDeltaToneEnum.NEGATIVE : YieldDeltaToneEnum.POSITIVE;
};

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
        tone: resolveTone(delta),
        change: formatPercent(Math.abs(delta?.ratio ?? 0)),
        isEstimated: summary?.earned.isEstimated === true
    };
};
