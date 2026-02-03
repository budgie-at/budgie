export interface PrivatbankRowInterface {
    readonly date: Date;
    readonly category: string;
    readonly card: string;
    readonly description: string;
    readonly cardAmount: number;
    readonly cardCurrency: string;
    readonly operationAmount: number;
    readonly operationCurrency: string;
    readonly endBalance: number;
    readonly balanceCurrency: string;
}
