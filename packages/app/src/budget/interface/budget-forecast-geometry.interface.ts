import type { BudgetForecastBillPointInterface } from './budget-forecast-bill-point.interface';

export interface BudgetForecastGeometryInterface {
    readonly actualPath: string;
    readonly projectedPath: string;
    readonly limitY: number;
    readonly todayX: number;
    readonly runOutX: number | null;
    readonly bills: readonly BudgetForecastBillPointInterface[];
}
