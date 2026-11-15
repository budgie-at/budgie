import type { YieldAccruingInterface } from './yield-accruing.interface';
import type { YieldFactInterface } from './yield-fact.interface';
import type { YieldHoldingsInterface } from './yield-holdings.interface';
import type { YieldLatestPriceInterface } from './yield-latest-price.interface';
import type { YieldPositionYieldInterface } from './yield-position-yield.interface';
import type { YieldVsRateInterface } from './yield-vs-rate.interface';
import type { YieldPositionRowInterface } from '@budgie/contracts';

export interface YieldPositionContextInterface {
    readonly row: YieldPositionRowInterface;
    readonly facts: readonly YieldFactInterface[];
    readonly holdings: YieldHoldingsInterface;
    readonly positionYield: YieldPositionYieldInterface;
    readonly latest: YieldLatestPriceInterface;
    readonly accruing: YieldAccruingInterface | null;
    readonly vsRate: YieldVsRateInterface | null;
}
