export interface YieldRunningPathsInputInterface {
    readonly cumulative: readonly number[];
    readonly prior: readonly number[] | null;
    readonly estimated: readonly boolean[];
    readonly axisTop: number;
    readonly width: number;
    readonly height: number;
}
