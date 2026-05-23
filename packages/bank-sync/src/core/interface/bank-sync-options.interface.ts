export interface BankSyncOptionsInterface {
    readonly maxPeriodSeconds: number;
    readonly rateLimitMs: number;
    readonly dormancyBoundaryMonths: number;
}
