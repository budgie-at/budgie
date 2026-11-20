export interface YieldRunningPathsInterface {
    readonly solid: string;
    readonly dashed: string;
    readonly area: string;
    readonly areaFadeStartX: number | null;
    readonly prior: string;
    readonly xs: readonly number[];
    readonly ys: readonly number[];
    readonly priorYs: readonly number[];
    readonly endX: number;
    readonly endY: number;
    readonly priorEndY: number | null;
}
