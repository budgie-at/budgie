export interface BankSyncOptionsInterface {
    readonly maxPeriodSeconds: number;
    readonly rateLimitMs: number;
    /** Backward sweep terminates once it has walked this many months past the last iteration that returned transactions. */
    readonly dormancyMonths: number;
}
