import { computeFundDueWindow } from './compute-fund-due-window.util';

import type { BudgetSpentLedgerEntryInterface } from '../../spent/interface/budget-spent-ledger-entry.interface';
import type { BudgetFundDrawInterface } from '../interface/budget-fund-draw.interface';
import type { BudgetFundMatchInterface } from '../interface/budget-fund-match.interface';

export const matchFundSpend = (
    entries: readonly Pick<BudgetSpentLedgerEntryInterface, 'entryId' | 'categoryId' | 'amount' | 'operatedAt'>[],
    funds: readonly BudgetFundMatchInterface[]
): readonly BudgetFundDrawInterface[] => {
    const chronological = [...entries].sort((first, second) => first.operatedAt.getTime() - second.operatedAt.getTime());
    const dueOrdered = [...funds].sort((first, second) => first.dueAt.getTime() - second.dueAt.getTime());
    const drawnByEntry = new Map<number, number>();
    const draws: BudgetFundDrawInterface[] = [];

    for (const fund of dueOrdered) {
        const dueWindow = computeFundDueWindow(fund.dueAt);
        let balance = fund.fundedAmount;

        for (const entry of chronological) {
            const isInsideWindow =
                entry.operatedAt.getTime() >= dueWindow.periodStart.getTime() &&
                entry.operatedAt.getTime() < dueWindow.nextPeriodStart.getTime();
            const amount = Math.min(entry.amount - (drawnByEntry.get(entry.entryId) ?? 0), balance);

            if (entry.categoryId === fund.categoryId && isInsideWindow && amount > 0) {
                draws.push({ fundId: fund.id, entryId: entry.entryId, amount });
                drawnByEntry.set(entry.entryId, (drawnByEntry.get(entry.entryId) ?? 0) + amount);
                balance -= amount;
            }
        }
    }

    return draws;
};
