import type { BudgetTuneSampleInterface } from './budget-tune-sample.interface';

export interface BudgetTuneCandidateInterface {
    readonly categoryId: number | null;
    readonly currentLimit: number;
    readonly isLocked: boolean;
    readonly samples: readonly BudgetTuneSampleInterface[];
}
