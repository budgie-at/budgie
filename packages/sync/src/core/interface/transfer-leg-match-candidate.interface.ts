export interface TransferLegMatchCandidateInterface {
    readonly externalIds: readonly string[];
    readonly title: string;
    readonly isIncome: boolean;
    readonly isKnown: boolean;
    readonly operatedAt: Date;
    readonly amount: number;
}
