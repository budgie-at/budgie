import type { BudgetCommittedSourceKindEnum } from '../enum/budget-committed-source-kind.enum';

export interface BudgetCommittedSourceInterface {
    readonly kind: BudgetCommittedSourceKindEnum;
    readonly id: number;
}
