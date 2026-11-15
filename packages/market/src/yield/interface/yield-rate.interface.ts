import type { YieldAnnualYieldInterface } from './yield-annual-yield.interface';

export interface YieldRateInterface extends YieldAnnualYieldInterface {
    readonly rewardValue: number;
    readonly estimatedRewardValue: number;
    readonly annualisationDays: number;
}
