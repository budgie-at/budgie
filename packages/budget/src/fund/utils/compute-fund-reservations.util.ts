import { computeFundDueWindow } from './compute-fund-due-window.util';
import { computeFundSetAside } from './compute-fund-set-aside.util';

import type { BudgetPeriodSpecInterface } from '../../period/interface/budget-period-spec.interface';
import type { BudgetPeriodWindowInterface } from '../../period/interface/budget-period-window.interface';
import type { BudgetReservationInterface } from '../../projection/interface/budget-reservation.interface';
import type { BudgetSpentLedgerEntryInterface } from '../../spent/interface/budget-spent-ledger-entry.interface';
import type { BudgetFundReservationSourceInterface } from '../interface/budget-fund-reservation-source.interface';

const hasPostedSpend = (
    fund: BudgetFundReservationSourceInterface,
    periodEntries: readonly Pick<BudgetSpentLedgerEntryInterface, 'categoryId' | 'operatedAt'>[]
): boolean => {
    const dueWindow = computeFundDueWindow(fund.dueAt);

    return periodEntries.some(
        entry =>
            entry.categoryId === fund.categoryId &&
            entry.operatedAt.getTime() >= dueWindow.periodStart.getTime() &&
            entry.operatedAt.getTime() < dueWindow.nextPeriodStart.getTime()
    );
};

export const computeFundReservations = (
    funds: readonly BudgetFundReservationSourceInterface[],
    window: BudgetPeriodWindowInterface,
    spec: BudgetPeriodSpecInterface,
    periodEntries: readonly Pick<BudgetSpentLedgerEntryInterface, 'categoryId' | 'operatedAt'>[]
): BudgetReservationInterface[] =>
    funds
        .filter(fund => !hasPostedSpend(fund, periodEntries))
        .map(fund => ({ fundId: fund.id, categoryId: fund.categoryId, amount: computeFundSetAside(fund, window, spec) }))
        .filter(reservation => reservation.amount > 0);
