export interface ErsteModernStandardTransactionStateInterface {
    readonly kind: 'standard';
    readonly date: Date;
    readonly amount: number;
    readonly isCredit: boolean;
    readonly leadingLines: string[];
    readonly trailingLines: string[];
}
