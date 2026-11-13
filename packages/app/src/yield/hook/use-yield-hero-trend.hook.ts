import { YieldDeltaKindEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatPercent } from '../../i18n/hook/use-format-percent.hook';

import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldHeroTrend = (summary: Pick<YieldSummaryInterface, 'delta' | 'earned'> | null) => {
    const { t } = useLingui();
    const formatPercent = useFormatPercent();
    const ratio = summary?.delta?.ratio ?? 0;
    const change = formatPercent(Math.abs(ratio));
    const trendByKind = {
        [YieldDeltaKindEnum.NEW]: t`, new this period`,
        [YieldDeltaKindEnum.CHANGE]: isPositiveNumber(ratio) ? t`, up ${change}` : t`, down ${change}`
    };
    const trend = isDefined(summary?.delta) ? trendByKind[summary.delta.kind] : '';
    const estimates = summary?.earned.isEstimated === true ? t`, includes estimated values` : '';

    return { trend, estimates };
};
