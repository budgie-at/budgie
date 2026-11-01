import type { BudgetUpcomingChargeInterface } from '../../projection/interface/budget-upcoming-charge.interface';
import type { BudgetSpentLedgerEntryInterface } from '../../spent/interface/budget-spent-ledger-entry.interface';

export interface BudgetFundReservationsInputInterface<
    TCharge extends Pick<BudgetUpcomingChargeInterface, 'date' | 'amount' | 'categoryId'>
> {
    readonly periodEntries: readonly Pick<BudgetSpentLedgerEntryInterface, 'entryId' | 'categoryId' | 'amount' | 'operatedAt'>[];
    readonly upcomingCharges: readonly TCharge[];
}
