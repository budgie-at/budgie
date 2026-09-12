export interface RunwayDriverInterface {
    readonly id: number | null;
    readonly title: string;
    readonly monthlyAmount: number;
    readonly isIrregular: boolean;
}
