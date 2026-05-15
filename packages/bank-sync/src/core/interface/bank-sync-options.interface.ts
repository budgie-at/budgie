export interface BankSyncOptionsInterface {
    readonly maxPeriodSeconds: number;
    readonly rateLimitMs: number;
    readonly historicalFloor: Date;
    readonly maxEmptyWindowsBeforeStop: number;
}
