import type { YieldAnnualYieldInterface } from './yield-annual-yield.interface';

export interface YieldPositionYieldInterface extends YieldAnnualYieldInterface {
    readonly rewardValue: number;
    readonly estimatedRewardValue: number;
    readonly averageValue: number;
    readonly estimatedAverageValue: number;
    readonly windowDays: number;
}
