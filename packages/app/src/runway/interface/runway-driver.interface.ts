export interface RunwayDriverInterface {
    readonly id: number | null;
    readonly title: string;
    readonly amount: number;
    readonly monthlyAmount: number;
    readonly monthlyAmounts: readonly number[];
    readonly isIrregular: boolean;
}
