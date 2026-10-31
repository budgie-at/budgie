import type { BudgetProjectionEntryInterface } from './budget-projection-entry.interface';
import type { BudgetReservationInterface } from './budget-reservation.interface';
import type { BudgetUpcomingChargeInterface } from './budget-upcoming-charge.interface';

export interface BudgetProjectionScopeItemsInterface {
    readonly entries: readonly BudgetProjectionEntryInterface[];
    readonly charges: readonly BudgetUpcomingChargeInterface[];
    readonly reservations: readonly BudgetReservationInterface[];
}
