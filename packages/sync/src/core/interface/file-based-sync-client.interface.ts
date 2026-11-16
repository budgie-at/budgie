import type { SyncAccountInterface } from './sync-account.interface';
import type { SyncBalanceSnapshotInterface } from './sync-balance-snapshot.interface';
import type { SyncTransactionInterface } from './sync-transaction.interface';

export interface FileBasedSyncClientInterface {
    getAccounts(): SyncAccountInterface[];
    getTransactions(accountId: string): SyncTransactionInterface[];
    getBalanceSnapshot?(accountId: string): SyncBalanceSnapshotInterface | null;
}
