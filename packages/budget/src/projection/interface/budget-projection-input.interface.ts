import type { BudgetCategoryLimitInputInterface } from '../../template/interface/budget-category-limit-input.interface';
import type { BudgetProjectionEntryInterface } from './budget-projection-entry.interface';
import type { BudgetReservationInterface } from './budget-reservation.interface';
import type { BudgetUpcomingChargeInterface } from './budget-upcoming-charge.interface';

export interface BudgetProjectionInputInterface {
    readonly periodStart: Date;
    readonly nextPeriodStart: Date;
    readonly now: Date;
    readonly overallLimit: number;
    readonly otherLimit: number;
    readonly categoryLimits: readonly BudgetCategoryLimitInputInterface[];
    readonly entries: readonly BudgetProjectionEntryInterface[];
    readonly upcomingCharges: readonly BudgetUpcomingChargeInterface[];
    readonly reservations: readonly BudgetReservationInterface[];
}
