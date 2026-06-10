export interface ConsolidationFamilyRunResultInterface {
    readonly blockedSourceTransactionIds: number[];
    readonly consolidated: number;
    readonly found: number;
}
