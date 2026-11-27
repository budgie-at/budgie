import { YieldDeltaKindEnum } from '@budgie/market';

import { isDefined } from '@rnw-community/shared';

import { roundYieldDifference } from './round-yield-difference.util';

import type { YieldSummaryInterface } from '@budgie/market';

const MIN_PRIOR_RATIO = 0.0001;

export const buildYieldDeltaChange = (
    summary: Pick<YieldSummaryInterface, 'delta' | 'earned' | 'priorTotals'> | null,
    decimalPlaces: number
) => {
    const earned = summary?.earned.value ?? 0;
    const priorTotal = isDefined(summary?.priorTotals)
        ? summary.priorTotals.reduce((sum, total) => sum + total, 0)
        : earned / Math.max(1 + (summary?.delta?.ratio ?? 0), MIN_PRIOR_RATIO);
    const roundedChange = Math.abs(roundYieldDifference(earned, priorTotal, decimalPlaces));
    const isNew = summary?.delta?.kind === YieldDeltaKindEnum.NEW;

    return { roundedChange, isNew, isZeroChange: !isNew && roundedChange === 0 };
};
