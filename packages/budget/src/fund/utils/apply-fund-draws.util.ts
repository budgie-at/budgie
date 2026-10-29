import { isDefined } from '@rnw-community/shared';

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

    return entries.flatMap(entry => {
        const drawn = drawnByEntry.get(entry.entryId);

        if (!isDefined(drawn)) {
            return [entry];
        }

        const remaining = entry.amount - drawn;

        return remaining > 0 ? [{ ...entry, amount: remaining }] : [];
    });
};
