import type { SyncOutboxEntityTable } from '../table/sync-outbox-entity.table';

export type SyncOutboxCreateEntityInterface = typeof SyncOutboxEntityTable.$inferInsert;
