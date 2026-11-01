export interface MarketChartGeometryInterface {
    readonly xs: readonly number[];
    readonly ys: readonly number[];
    readonly linePath: string;
    readonly areaPath: string;
    readonly baselineY: number;
    readonly isFlat: boolean;
}
