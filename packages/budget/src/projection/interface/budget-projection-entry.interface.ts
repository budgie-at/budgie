import type { BudgetCommittedSourceInterface } from './budget-committed-source.interface';

export interface BudgetProjectionEntryInterface {
    readonly amount: number;
    readonly categoryId: number | null;
    readonly operatedAt: Date;
    readonly committedSource: BudgetCommittedSourceInterface | null;
}
