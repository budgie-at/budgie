import { convertEntryAmount } from '../../spent/utils/budget-spent.util';

import type { BudgetSpentEntryInterface } from '../../spent/interface/budget-spent-entry.interface';

export const computeIncomeReceived = (entries: readonly BudgetSpentEntryInterface[], baseInstrumentId: number): number =>
    entries.reduce((total, entry) => total + convertEntryAmount(entry, baseInstrumentId), 0);
