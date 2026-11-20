import type { YieldGroupEnum, YieldRangeEnum } from '@budgie/market';

export interface YieldHeroLineInputInterface {
    readonly isScrubbing: boolean;
    readonly group: YieldGroupEnum | null;
    readonly range: YieldRangeEnum;
    readonly rate: number | null;
}
