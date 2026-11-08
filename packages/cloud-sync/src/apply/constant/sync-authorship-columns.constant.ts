import type { SyncAuthorshipColumnInterface } from '../interface/sync-authorship-column.interface';

export const SYNC_AUTHORSHIP_COLUMNS: Readonly<Record<string, SyncAuthorshipColumnInterface>> = {
    transactions: { property: 'updatedBy', userValue: 'user' },
    transaction_entries: { property: 'categorySource', userValue: 'USER' },
    transaction_tags: { property: 'source', userValue: 'USER' }
};
