export interface ConvertToInstallmentModalParamsInterface {
    readonly transactionId: number;
    readonly title: string;
    readonly amount: number;
    readonly instrumentSymbol: string;
    readonly accountTitle: string;
    readonly operatedAt: Date;
}
