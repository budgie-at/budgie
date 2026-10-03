import type { SyncAccountInterface } from './sync-account.interface';
import type { SyncTransactionInterface } from './sync-transaction.interface';

export interface FileBasedSyncClientInterface {
    getAccounts(): SyncAccountInterface[];
    getTransactions(accountId: string): SyncTransactionInterface[];
}
