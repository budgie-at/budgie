import type { BudgetSpentLedgerEntryInterface } from '../../spent/interface/budget-spent-ledger-entry.interface';
import type { BudgetFundDrawInterface } from '../interface/budget-fund-draw.interface';

export const applyFundDraws = <T extends Pick<BudgetSpentLedgerEntryInterface, 'entryId' | 'amount'>>(
    entries: readonly T[],
    draws: readonly BudgetFundDrawInterface[]
): T[] => {
    const drawnByEntry = new Map<number, number>();

    for (const draw of draws) {
        drawnByEntry.set(draw.entryId, (drawnByEntry.get(draw.entryId) ?? 0) + draw.amount);
    }

    return entries
        .map(entry => ({ ...entry, amount: entry.amount - (drawnByEntry.get(entry.entryId) ?? 0) }))
        .filter(entry => entry.amount > 0);
};
