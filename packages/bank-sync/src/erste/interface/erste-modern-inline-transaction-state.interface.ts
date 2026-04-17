export interface ErsteModernInlineTransactionStateInterface {
    readonly kind: 'inline';
    readonly date: Date;
    readonly reference: string;
    readonly amount: number;
    readonly isCredit: boolean;
    readonly continuationLines: string[];
}
