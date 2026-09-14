import type { RunwayDriverInterface } from './runway-driver.interface';

export interface RunwayDriverBreakdownInterface {
    readonly drivers: readonly RunwayDriverInterface[];
    readonly irregularMonthlyAmount: number;
}
