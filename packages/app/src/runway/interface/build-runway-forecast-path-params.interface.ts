import type { RunwayComputationInterface } from './runway-computation.interface';

export interface BuildRunwayForecastPathParamsInterface {
    readonly computation: RunwayComputationInterface;
    readonly width: number;
    readonly height: number;
    readonly paddingLeft: number;
    readonly paddingRight: number;
    readonly paddingTop: number;
    readonly paddingBottom: number;
}
