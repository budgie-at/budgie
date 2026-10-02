import type { SyncAccountInterface } from './sync-account.interface';
import type { SyncError } from './sync-error.type';
import type { SyncTransactionInterface } from './sync-transaction.interface';
import type * as Effect from 'effect/Effect';

export interface SyncProviderClientInterface {
    getAccounts(): Effect.Effect<SyncAccountInterface[], SyncError>;
    getTransactions(accountId: string, from: number, to?: number): Effect.Effect<SyncTransactionInterface[], SyncError>;
}
