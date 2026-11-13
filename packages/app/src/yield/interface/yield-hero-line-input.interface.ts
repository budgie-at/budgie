import type { YieldGroupEnum } from '@budgie/market';

export interface YieldHeroLineInputInterface {
    readonly isScrubbing: boolean;
    readonly bucketTax: number;
    readonly group: YieldGroupEnum | null;
    readonly rate: number | null;
}
