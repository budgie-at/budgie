import type { YieldAnnualYieldInterface } from './yield-annual-yield.interface';

export interface YieldCombinedYieldInterface extends YieldAnnualYieldInterface {
    readonly holdingCount: number;
    readonly totalCount: number;
    readonly isPartialCoverage: boolean;
    readonly excludesDistributions: boolean;
}
