import type { BudgetForecastPointInterface } from './budget-forecast-point.interface';

export interface BudgetForecastBillPointInterface extends BudgetForecastPointInterface {
    readonly key: string;
    readonly title: string;
    readonly labelY: number;
}
