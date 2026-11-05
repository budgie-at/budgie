import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

import type { SyncColumnDescriptorInterface } from './sync-column-descriptor.interface';
import type { SyncParentLinkInterface } from './sync-parent-link.interface';

export interface SyncTableDescriptorInterface {
    readonly table: SQLiteTable;
    readonly tableName: string;
    readonly columns: readonly SyncColumnDescriptorInterface[];
    readonly parentLink: SyncParentLinkInterface | null;
}
