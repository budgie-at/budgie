import type { YieldBucketUnitEnum } from '../enum/yield-bucket-unit.enum';
import type { YieldBucketInterface } from './yield-bucket.interface';
import type { YieldCombinedYieldInterface } from './yield-combined-yield.interface';
import type { YieldCryptoRewardsInterface } from './yield-crypto-rewards.interface';
import type { YieldDeltaInterface } from './yield-delta.interface';
import type { YieldEstimateCauseInterface } from './yield-estimate-cause.interface';
import type { YieldEstimatedFigureInterface } from './yield-estimated-figure.interface';
import type { YieldGroupTotalInterface } from './yield-group-total.interface';
import type { YieldPositionSummaryInterface } from './yield-position-summary.interface';
import type { YieldVsRateInterface } from './yield-vs-rate.interface';

export interface YieldSummaryInterface {
    readonly hasYield: boolean;
    readonly windowStart: string;
    readonly today: string;
    readonly bucketUnit: YieldBucketUnitEnum;
    readonly buckets: readonly YieldBucketInterface[];
    readonly priorTotals: readonly number[] | null;
    readonly earned: YieldEstimatedFigureInterface;
    readonly payoutCount: number;
    readonly tax: number;
    readonly net: number;
    readonly share: number | null;
    readonly delta: YieldDeltaInterface | null;
    readonly annualYield: YieldCombinedYieldInterface;
    readonly runRate: YieldEstimatedFigureInterface | null;
    readonly cryptoRewardsToday: YieldCryptoRewardsInterface | null;
    readonly vsRate: YieldVsRateInterface | null;
    readonly groups: readonly YieldGroupTotalInterface[];
    readonly positions: readonly YieldPositionSummaryInterface[];
    readonly hasUnassigned: boolean;
    readonly firstYieldDay: string | null;
    readonly lastPayoutDay: string | null;
    readonly estimateCauses: readonly YieldEstimateCauseInterface[];
    readonly instrumentIds: readonly number[];
}
