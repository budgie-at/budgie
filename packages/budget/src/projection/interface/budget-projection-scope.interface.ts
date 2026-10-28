import type { BudgetPaceStatusEnum } from '../enum/budget-pace-status.enum';

export interface BudgetProjectionScopeInterface {
    readonly limit: number;
    readonly spent: number;
    readonly upcoming: number;
    readonly free: number;
    readonly safePerDay: number;
    readonly elapsedFraction: number;
    readonly projectedEnd: number | null;
    readonly projectedOver: number | null;
    readonly projectedRatio: number | null;
    readonly status: BudgetPaceStatusEnum;
    readonly runOutAt: Date | null;
}
