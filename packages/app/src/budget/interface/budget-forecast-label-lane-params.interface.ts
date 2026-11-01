import type { BudgetForecastPointInterface } from './budget-forecast-point.interface';

export interface BudgetForecastLabelLaneParamsInterface {
    readonly anchor: BudgetForecastPointInterface;
    readonly lines: readonly (readonly BudgetForecastPointInterface[])[];
    readonly labelWidth: number;
    readonly fontSize: number;
    readonly limitY: number;
    readonly top: number;
    readonly bottom: number;
}
