import { getSyncColumnName } from './get-sync-column-name.util';
import { normalizeSyncCell } from './normalize-sync-cell.util';

import type { SyncTableDescriptorInterface } from '../../mapping/interface/sync-table-descriptor.interface';
import type { SyncLocalRowInterface } from '../interface/sync-local-row.interface';
import type { SyncCellType } from '../type/sync-cell.type';

export const toLocalCells = (descriptor: SyncTableDescriptorInterface, localRow: SyncLocalRowInterface): Record<string, SyncCellType> =>
    Object.fromEntries(
        descriptor.columns.map(column => [column.property, normalizeSyncCell(localRow[getSyncColumnName(descriptor, column.property)])])
    );
