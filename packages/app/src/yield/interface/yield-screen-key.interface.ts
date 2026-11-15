import type { YieldPeriodInterface } from './yield-period.interface';
import type { YieldQueryKeyInterface } from '@budgie/market';

export interface YieldScreenKeyInterface {
    readonly key: YieldQueryKeyInterface;
    readonly focusDay: string | null;
    readonly from: string | null;
    readonly scopeId: string | null;
    readonly period: YieldPeriodInterface | null;
}
