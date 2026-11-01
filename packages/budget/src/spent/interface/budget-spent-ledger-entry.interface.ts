import type { BudgetSpentEntryInterface } from './budget-spent-entry.interface';

export interface BudgetSpentLedgerEntryInterface extends BudgetSpentEntryInterface {
    readonly entryId: number;
    readonly transactionId: number;
    readonly operatedAt: Date;
}
