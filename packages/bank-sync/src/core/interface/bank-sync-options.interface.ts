export interface BankSyncOptionsInterface {
    readonly maxPeriodSeconds: number;
    readonly rateLimitMs: number;
    readonly dormancyMonths: number;
}
