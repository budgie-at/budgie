export interface ConsolidationScanScopeInterface {
    readonly operatedAtFrom: Date;
    readonly operatedAtTo: Date;
    readonly transactionIds: readonly number[];
}
