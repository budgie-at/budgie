import type { YieldRateInterface } from './yield-rate.interface';

export interface YieldPositionYieldInterface extends YieldRateInterface {
    readonly averageValue: number;
    readonly estimatedAverageValue: number;
}
