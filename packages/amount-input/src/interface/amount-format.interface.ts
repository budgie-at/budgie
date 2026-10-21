export interface AmountFormatInterface {
    readonly decimalSeparator: string;
    readonly groupingSeparator: string;
    readonly decimalPlaces: number;
    readonly format: (value: number) => string;
}
