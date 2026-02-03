export interface BaseTransactionFieldsInterface {
    readonly id: string;
    readonly time: number;
    readonly description: string;
    readonly mcc: number;
    readonly originalMcc: number;
    readonly amount: number;
    readonly operationAmount: number;
    readonly currencyCode: number;
    readonly commissionRate: number;
    readonly cashbackAmount: number;
    readonly balance: number;
    readonly hold: boolean;
    readonly receiptId?: string;
    readonly invoiceId?: string;
    readonly counterEdrpou?: string;
    readonly counterIban?: string;
    readonly counterName?: string;
    readonly comment?: string;
    readonly category?: string;
}
