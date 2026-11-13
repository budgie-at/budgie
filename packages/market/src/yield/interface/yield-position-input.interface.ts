import type { YieldFactInterface } from './yield-fact.interface';
import type { YieldMovementInterface } from './yield-movement.interface';

export interface YieldPositionInputInterface {
    readonly facts: readonly YieldFactInterface[];
    readonly movements: readonly YieldMovementInterface[];
    readonly baseInstrumentId: number;
    readonly todayDay: string;
    readonly yieldWindowStart: string;
}
