import type { YieldBucketInterface } from '@budgie/market';

export interface YieldScrubComparisonInterface {
    readonly current: number;
    readonly previous: number;
    readonly previousBucket: YieldBucketInterface | null;
}
