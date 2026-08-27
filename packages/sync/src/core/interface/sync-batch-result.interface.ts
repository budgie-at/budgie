import type { SyncTransactionInterface } from './sync-transaction.interface';

export interface SyncBatchResultInterface {
    readonly transactions: SyncTransactionInterface[];
    readonly transactionCount?: number;
    readonly nextTo: Date;
    readonly nextFrom: Date;
    readonly completed: boolean;
}
