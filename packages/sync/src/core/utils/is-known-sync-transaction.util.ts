import type { SyncTransactionInterface } from '../interface/sync-transaction.interface';

export const isKnownSyncTransaction = (
    transaction: Pick<SyncTransactionInterface, 'id' | 'legacyExternalIds'>,
    knownExternalIds: ReadonlySet<string> | ReadonlyMap<string, number>
): boolean => [transaction.id, ...(transaction.legacyExternalIds ?? [])].some(externalId => knownExternalIds.has(externalId));
