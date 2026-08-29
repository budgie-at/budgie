import type { SyncAccountInterface } from './sync-account.interface';
import type { SyncTransactionInterface } from './sync-transaction.interface';

export interface SyncedDataInterface {
    readonly accounts: SyncAccountInterface[];
    readonly transactions: SyncTransactionInterface[];
}
