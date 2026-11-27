export interface ConsolidationFamilyRunResultInterface {
    readonly blockedSourceTransactionIds: number[];
    readonly releasedTransactionIds: number[];
    readonly consolidated: number;
    readonly found: number;
}
