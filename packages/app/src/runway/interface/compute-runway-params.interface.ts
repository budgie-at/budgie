import { RunwaySeriesRowInterface } from '@budgie/contracts';

export interface ComputeRunwayParams {
    readonly series: readonly RunwaySeriesRowInterface[];
    readonly liquid: number;
    readonly irregularMonthlyAmounts: readonly number[];
    readonly isAllIn: boolean;
    readonly referenceDate: Date;
}
