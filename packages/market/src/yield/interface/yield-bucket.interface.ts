import type { YieldGroupAmountsType } from './yield-group-amounts.type';

export interface YieldBucketInterface {
    readonly start: string;
    readonly end: string;
    readonly isInProgress: boolean;
    readonly amounts: YieldGroupAmountsType;
    readonly estimatedAmounts: YieldGroupAmountsType;
    readonly total: number;
    readonly isEstimated: boolean;
}
