import type { BudgetCategoryProjectionInterface } from './budget-category-projection.interface';
import type { BudgetProjectionDayInterface } from './budget-projection-day.interface';
import type { BudgetProjectionScopeInterface } from './budget-projection-scope.interface';
import type { BudgetUpcomingChargeInterface } from './budget-upcoming-charge.interface';

export interface BudgetProjectionInterface {
    readonly totalDays: number;
    readonly elapsedDays: number;
    readonly daysLeft: number;
    readonly overall: BudgetProjectionScopeInterface;
    readonly categories: readonly BudgetCategoryProjectionInterface[];
    readonly other: BudgetProjectionScopeInterface;
    readonly days: readonly BudgetProjectionDayInterface[];
    readonly upcomingCharges: readonly BudgetUpcomingChargeInterface[];
}
