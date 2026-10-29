import type { BudgetCommittedSourceInterface } from './budget-committed-source.interface';

export interface BudgetUpcomingChargeInterface {
    readonly date: Date;
    readonly amount: number;
    readonly categoryId: number | null;
    readonly title: string;
    readonly source: BudgetCommittedSourceInterface;
    readonly cadenceDays: number;
}
