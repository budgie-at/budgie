export interface HouseholdAlignmentEntryInterface {
    readonly transactionId: number;
    readonly transactionSyncId: string;
    readonly transactionZone: string;
    readonly entryId: number;
    readonly entryZone: string;
    readonly accountZone: string;
    readonly categoryId: number | null;
    readonly categoryZone: string | null;
}
