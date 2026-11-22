import { isDefined } from '@rnw-community/shared';

import { buildYieldRunningTotal } from './build-yield-running-total.util';

import type { YieldSummaryInterface } from '@budgie/market';

export const buildYieldSummaryRunningTotals = (summary: Pick<YieldSummaryInterface, 'buckets' | 'priorTotals'>) => ({
    cumulative: buildYieldRunningTotal(summary.buckets.map(bucket => bucket.total)),
    prior: isDefined(summary.priorTotals) ? buildYieldRunningTotal(summary.priorTotals) : null
});
