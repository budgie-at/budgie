import type { BudgetForecastBillPointInterface } from './budget-forecast-bill-point.interface';
import type { BudgetForecastPointInterface } from './budget-forecast-point.interface';

export interface BudgetForecastGeometryInterface {
    readonly actualPath: string;
    readonly projectedPath: string;
    readonly projectedEndPoint: BudgetForecastPointInterface | null;
    readonly todayPoint: BudgetForecastPointInterface | null;
    readonly limitY: number;
    readonly todayX: number;
    readonly runOutX: number | null;
    readonly bills: readonly BudgetForecastBillPointInterface[];
}
