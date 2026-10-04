export interface PrivatbankExternalIdInputInterface {
    readonly rawDate: string;
    readonly deviceLocalDate: Date;
    readonly category: string;
    readonly card: string;
    readonly cardAmount: number;
    readonly cardCurrency: string;
    readonly operationAmount: number;
    readonly operationCurrency: string;
    readonly endBalance: number;
    readonly balanceCurrency: string;
    readonly description: string;
}
