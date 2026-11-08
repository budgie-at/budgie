export interface SyncRecurringSeriesRowInterface {
    readonly localId: number;
    readonly syncZone: string;
    readonly syncId: string;
    readonly kind: string;
    readonly merchantKey: string;
    readonly periodDays: number;
    readonly userState: string;
    readonly status: string;
    readonly amount: number;
    readonly title: string;
    readonly categoryId: number | null;
    readonly lastSeenAt: number;
    readonly updatedAt: number;
}
