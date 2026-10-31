import { computeFundDueWindow } from './compute-fund-due-window.util';
import { computeFundSetAside } from './compute-fund-set-aside.util';
import { matchFundSpend } from './match-fund-spend.util';

import type { BudgetPeriodSpecInterface } from '../../period/interface/budget-period-spec.interface';
import type { BudgetPeriodWindowInterface } from '../../period/interface/budget-period-window.interface';
import type { BudgetUpcomingChargeInterface } from '../../projection/interface/budget-upcoming-charge.interface';
import type { BudgetFundReservationSourceInterface } from '../interface/budget-fund-reservation-source.interface';
import type { BudgetFundReservationsInputInterface } from '../interface/budget-fund-reservations-input.interface';
import type { BudgetFundReservationsInterface } from '../interface/budget-fund-reservations.interface';

export const computeFundReservations = <TCharge extends Pick<BudgetUpcomingChargeInterface, 'date' | 'amount' | 'categoryId'>>(
    funds: readonly BudgetFundReservationSourceInterface[],
    window: BudgetPeriodWindowInterface,
    spec: BudgetPeriodSpecInterface,
    { periodEntries, upcomingCharges }: BudgetFundReservationsInputInterface<TCharge>
): BudgetFundReservationsInterface<TCharge> => {
    const draws = matchFundSpend(periodEntries, funds);
    const chronologicalChargeIndexes = upcomingCharges
        .map((_charge, index) => index)
        .sort((first, second) => (upcomingCharges[first]?.date.getTime() ?? 0) - (upcomingCharges[second]?.date.getTime() ?? 0));
    const chargeAmounts = upcomingCharges.map(charge => charge.amount);
    const coveredChargeIndexes = new Set<number>();
    const settledFundIds = new Set(draws.map(draw => draw.fundId));

    for (const fund of [...funds].sort((first, second) => first.dueAt.getTime() - second.dueAt.getTime())) {
        const dueWindow = computeFundDueWindow(fund.dueAt);
        let balance = draws.filter(draw => draw.fundId === fund.id).reduce((remaining, draw) => remaining - draw.amount, fund.fundedAmount);

        for (const index of chronologicalChargeIndexes) {
            const charge = upcomingCharges[index];
            const isCovered =
                charge.categoryId === fund.categoryId &&
                charge.date.getTime() >= dueWindow.periodStart.getTime() &&
                charge.date.getTime() < dueWindow.nextPeriodStart.getTime() &&
                charge.date.getTime() < window.nextPeriodStart.getTime();

            if (isCovered) {
                const covered = Math.max(Math.min(balance, chargeAmounts[index] ?? 0), 0);

                chargeAmounts[index] = (chargeAmounts[index] ?? 0) - covered;
                balance -= covered;
                coveredChargeIndexes.add(index);
                settledFundIds.add(fund.id);
            }
        }
    }

    return {
        reservations: funds
            .filter(fund => !settledFundIds.has(fund.id))
            .map(fund => ({ fundId: fund.id, categoryId: fund.categoryId, amount: computeFundSetAside(fund, window, spec) }))
            .filter(reservation => reservation.amount > 0),
        upcomingCharges: upcomingCharges.flatMap((charge, index) => {
            const amount = chargeAmounts[index] ?? charge.amount;

            return coveredChargeIndexes.has(index) && amount <= 0 ? [] : [{ ...charge, amount }];
        })
    };
};
