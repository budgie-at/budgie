import { BudgetStatusEnum } from '../enum/budget-status.enum';

export interface BudgetTrendDataPointInterface {
    readonly periodLabel: string;
    readonly periodStart: Date;
    readonly spent: number;
    readonly limit: number;
    readonly percentage: number;
    readonly status: BudgetStatusEnum;
}
