import { deriveSyncId } from './derive-sync-id.util';

const BANK_TRANSACTION_NAMESPACE = '36f6d9e3-aa5b-4896-a8cf-c3e2e734249a';

export const deriveBankTransactionSyncId = (source: string, accountExternalId: string, transactionExternalId: string): string =>
    deriveSyncId(BANK_TRANSACTION_NAMESPACE, `${source}:${accountExternalId}:${transactionExternalId}`);
