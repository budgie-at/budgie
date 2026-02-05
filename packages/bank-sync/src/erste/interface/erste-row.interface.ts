export interface ErsteRowInterface {
    readonly date: Date;
    readonly reference: string;
    readonly description: string;
    readonly details: string;
    readonly amount: number;
    readonly isCredit: boolean;
}
