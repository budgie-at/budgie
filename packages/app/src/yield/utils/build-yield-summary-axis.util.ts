import { YieldGroupEnum } from '@budgie/market';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { YIELD_NEGATIVE_BAND } from '../constant/yield-negative-band.constant';
import { YIELD_PLOT_HEIGHT } from '../constant/yield-plot-height.constant';
import { YIELD_STACK_GROUPS } from '../constant/yield-stack-groups.constant';
import { YieldChartModeEnum } from '../enum/yield-chart-mode.enum';

import { buildYieldAxis } from './build-yield-axis.util';
import { buildYieldSummaryRunningTotals } from './build-yield-summary-running-totals.util';

import type { YieldAxisInterface } from '../interface/yield-axis.interface';
import type { YieldSummaryInterface } from '@budgie/market';

const POSITIVE_BAND = YIELD_PLOT_HEIGHT - YIELD_NEGATIVE_BAND;

const reserveNegativeBand = (axis: YieldAxisInterface): YieldAxisInterface => ({
    ...axis,
    bottom: -((axis.top * YIELD_NEGATIVE_BAND) / POSITIVE_BAND)
});

export const buildYieldSummaryAxis = (
    summary: Pick<YieldSummaryInterface, 'buckets' | 'priorTotals'>,
    group: YieldGroupEnum | null,
    mode: YieldChartModeEnum
): YieldAxisInterface => {
    if (mode === YieldChartModeEnum.RUNNING_TOTAL) {
        const { cumulative, prior } = buildYieldSummaryRunningTotals(summary);

        return buildYieldAxis(Math.max(0, ...cumulative, ...(prior ?? [])), 0);
    }

    const visibleGroups = isDefined(group) ? [group] : YIELD_STACK_GROUPS;
    const totals = summary.buckets.map(bucket => visibleGroups.reduce((sum, visible) => sum + bucket.amounts[visible], 0));
    const taxDepth = Math.max(0, ...summary.buckets.map(bucket => bucket.amounts[YieldGroupEnum.TAX]));

    const axis = buildYieldAxis(Math.max(0, ...totals), taxDepth);

    return isPositiveNumber(taxDepth) ? reserveNegativeBand(axis) : axis;
};
