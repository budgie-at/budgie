export interface RunwayForecastGeometryInterface {
    readonly medianPath: string;
    readonly bandPath: string;
    readonly zeroY: number;
    readonly runOutX: number | null;
    readonly runOutY: number | null;
    readonly tickXs: readonly number[];
}
