import type { SyncAccountInterface } from '../interface/sync-account.interface';
import type { SyncClientInfoInterface } from '../interface/sync-client-info.interface';
import type { SyncResultInterface } from '../interface/sync-result.type';
import type { SyncTransactionInterface } from '../interface/sync-transaction.interface';

export interface SyncProviderClientInterface {
    getClientInfo(): Promise<SyncResultInterface<SyncClientInfoInterface>>;
    getAccounts(): Promise<SyncResultInterface<SyncAccountInterface[]>>;
    getTransactions(accountId: string, from: number, to?: number): Promise<SyncResultInterface<SyncTransactionInterface[]>>;
}
