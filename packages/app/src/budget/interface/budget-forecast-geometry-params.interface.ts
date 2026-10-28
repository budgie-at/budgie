import type { BudgetProjectionInterface } from '@budgie/budget';

export interface BudgetForecastGeometryParamsInterface {
    readonly projection: BudgetProjectionInterface;
    readonly width: number;
    readonly height: number;
    readonly paddingLeft: number;
    readonly paddingRight: number;
    readonly paddingTop: number;
    readonly paddingBottom: number;
}
