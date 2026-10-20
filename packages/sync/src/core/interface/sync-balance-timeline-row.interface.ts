export interface SyncBalanceTimelineRowInterface {
    readonly operatedAt: Date;
    readonly amount: number;
    readonly providerBalance: number | null;
}
