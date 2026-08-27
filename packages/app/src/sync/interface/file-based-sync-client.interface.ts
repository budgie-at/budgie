import type { SyncAccountInterface, SyncTransactionInterface } from '@budgie/sync';

export interface FileBasedSyncClientInterface {
    getAccounts(): SyncAccountInterface[];
    getTransactions(accountId: string): SyncTransactionInterface[];
}
