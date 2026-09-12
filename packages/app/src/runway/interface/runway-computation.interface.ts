export interface RunwayComputationInterface {
    readonly burn: number;
    readonly income: number;
    readonly net: number;
    readonly allInNet: number;
    readonly liquid: number;
    readonly runwayMonths: number | null;
    readonly allInRunwayMonths: number | null;
    readonly allInRunsOutAt: Date | null;
    readonly runsOutAt: Date | null;
    readonly p25Net: number;
    readonly p75Net: number;
    readonly monthsUsed: number;
    readonly isPositive: boolean;
}
