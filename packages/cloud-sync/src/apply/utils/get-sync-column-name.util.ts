import { getTableColumns } from 'drizzle-orm';

import type { SyncTableDescriptorInterface } from '../../mapping/interface/sync-table-descriptor.interface';

export const getSyncColumnName = (descriptor: SyncTableDescriptorInterface, property: string): string =>
    getTableColumns(descriptor.table)[property].name;
