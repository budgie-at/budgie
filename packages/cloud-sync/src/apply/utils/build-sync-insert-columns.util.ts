import { SYNC_INSERT_PLACEHOLDERS } from '../constant/sync-insert-placeholders.constant';

import { getSyncColumnName } from './get-sync-column-name.util';
import { normalizeSyncCell } from './normalize-sync-cell.util';
import { readSyncReferenceId } from './read-sync-reference-id.util';

import type { SyncRowInterface } from '../../mapping/interface/sync-row.interface';
import type { SyncTableDescriptorInterface } from '../../mapping/interface/sync-table-descriptor.interface';
import type { SyncCellType } from '../type/sync-cell.type';
import type { SyncResolutionsType } from '../type/sync-resolutions.type';

export const buildSyncInsertColumns = (
    descriptor: SyncTableDescriptorInterface,
    row: SyncRowInterface,
    resolutions: SyncResolutionsType,
    unitIds: ReadonlyMap<string, number>
): Record<string, SyncCellType> => ({
    sync_id: row.syncId,
    sync_zone: row.syncZone,
    ...SYNC_INSERT_PLACEHOLDERS[row.tableName]?.(row.syncId),
    ...Object.fromEntries(
        Object.entries(row.values).map(([property, value]) => [getSyncColumnName(descriptor, property), normalizeSyncCell(value)])
    ),
    ...Object.fromEntries(
        row.references.map(reference => [
            getSyncColumnName(descriptor, reference.column),
            readSyncReferenceId(row, reference.column, resolutions, unitIds)
        ])
    )
});
