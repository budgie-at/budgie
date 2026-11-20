import type { YieldAxisInterface } from './yield-axis.interface';
import type { YieldBucketInterface, YieldGroupEnum } from '@budgie/market';

export interface YieldBarLayoutInputInterface {
    readonly buckets: readonly YieldBucketInterface[];
    readonly visibleGroups: readonly YieldGroupEnum[];
    readonly width: number;
    readonly height: number;
    readonly axis: YieldAxisInterface;
}
