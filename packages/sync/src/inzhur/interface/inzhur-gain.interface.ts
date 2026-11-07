export interface InzhurGainInterface {
    readonly startDate: string;
    readonly startValue: number | null;
    readonly endValue: number | null;
    readonly contributions: number;
    readonly gain: number | null;
    readonly percent: number | null;
}
