export interface HouseholdTransactionAlignmentInterface {
    readonly transactionId: number;
    readonly syncId: string;
    readonly oldHome: string;
    readonly newHome: string;
    readonly isChanged: boolean;
}
