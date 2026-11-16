export interface SyncBalanceSnapshotInterface {
    readonly at: Date;
    readonly balance: number;
    readonly precedingSameSecondBalances?: readonly number[];
}
