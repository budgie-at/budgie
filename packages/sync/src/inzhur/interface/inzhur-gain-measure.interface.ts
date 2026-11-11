export interface InzhurGainMeasureInterface {
    readonly valueOn: (day: string) => number | null;
    readonly contributionsUntil: (day: string) => number;
}
