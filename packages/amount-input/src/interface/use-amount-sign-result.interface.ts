export interface UseAmountSignResultInterface {
    readonly isNegative: boolean;
    readonly absoluteValue: number;
    readonly toggleSign: () => void;
    readonly changeAbsoluteValue: (absoluteValue: number) => void;
}
