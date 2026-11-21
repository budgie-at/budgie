import { isDefined } from '@rnw-community/shared';

import { YieldChartModeEnum } from '../enum/yield-chart-mode.enum';

import type { YieldScrubComparisonInterface } from '../interface/yield-scrub-comparison.interface';
import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

const sumTotals = (totals: readonly number[]) => totals.reduce((sum, total) => sum + total, 0);

export const resolveYieldScrubComparison = (
    summary: Pick<YieldSummaryInterface, 'buckets' | 'priorTotals'>,
    bucket: YieldBucketInterface,
    mode: YieldChartModeEnum
): YieldScrubComparisonInterface | null => {
    const index = summary.buckets.indexOf(bucket);

    if (mode === YieldChartModeEnum.RUNNING_TOTAL) {
        const { priorTotals } = summary;

        return isDefined(priorTotals) && index < priorTotals.length
            ? {
                  current: sumTotals(summary.buckets.slice(0, index + 1).map(item => item.total)),
                  previous: sumTotals(priorTotals.slice(0, index + 1)),
                  previousBucket: null
              }
            : null;
    }

    const previousBucket = index > 0 ? (summary.buckets.at(index - 1) ?? null) : null;

    return isDefined(previousBucket) && !bucket.isInProgress
        ? { current: bucket.total, previous: previousBucket.total, previousBucket }
        : null;
};
