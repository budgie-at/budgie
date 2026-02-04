export interface ErsteAccountInfoInterface {
    readonly iban: string;
    readonly accountNumber: string;
    readonly currency: string;
    readonly oldBalance: number;
    readonly newBalance: number;
    readonly statementDate: Date;
}
