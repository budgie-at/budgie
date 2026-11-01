import { convertEntryAmount } from './budget-spent.util';

import type { BudgetSpentLedgerEntryInterface } from '../interface/budget-spent-ledger-entry.interface';

export const toBudgetCurrencyEntries = (
    entries: readonly BudgetSpentLedgerEntryInterface[],
    baseInstrumentId: number
): BudgetSpentLedgerEntryInterface[] =>
    entries.map(entry => ({ ...entry, amount: convertEntryAmount(entry, baseInstrumentId), instrumentId: baseInstrumentId, rate: null }));
