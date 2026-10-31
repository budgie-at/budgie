import type { BudgetReservationInterface } from '../../projection/interface/budget-reservation.interface';

export interface BudgetFundReservationsInterface<TCharge> {
    readonly reservations: BudgetReservationInterface[];
    readonly upcomingCharges: TCharge[];
}
