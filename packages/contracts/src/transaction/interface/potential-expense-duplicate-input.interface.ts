export interface PotentialExpenseDuplicateInputInterface {
    readonly accountId: number;
    readonly amountInMicroUnits: number;
    readonly normalizedTitle: string;
    readonly operatedAt: Date;
    readonly timeWindowSeconds: number;
}
