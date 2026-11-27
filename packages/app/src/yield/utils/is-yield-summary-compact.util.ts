import { isDefined } from '@rnw-community/shared';

import type { YieldSummaryInterface } from '@budgie/market';

const YIELD_MIN_DATA_BUCKETS = 3;

export const isYieldSummaryCompact = (summary: YieldSummaryInterface | null): boolean =>
    isDefined(summary) && summary.buckets.filter(bucket => bucket.total > 0).length < YIELD_MIN_DATA_BUCKETS;
