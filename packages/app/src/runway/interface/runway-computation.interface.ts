export interface RunwayComputationInterface {
    readonly burn: number;
    readonly income: number;
    readonly net: number;
    readonly liquid: number;
    readonly runwayMonths: number | null;
    readonly runsOutAt: Date | null;
    readonly p25Net: number;
    readonly p75Net: number;
    readonly monthsUsed: number;
    readonly isPositive: boolean;
}
