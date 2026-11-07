import { getSyncColumnName } from './get-sync-column-name.util';

import type { SyncTableDescriptorInterface } from '../../mapping/interface/sync-table-descriptor.interface';
import type { SyncCellType } from '../type/sync-cell.type';

export const diffSyncCells = (
    descriptor: SyncTableDescriptorInterface,
    merged: Readonly<Record<string, SyncCellType>>,
    local: Readonly<Record<string, SyncCellType>>
): Record<string, SyncCellType> =>
    Object.fromEntries(
        Object.keys(merged)
            .filter(property => merged[property] !== (local[property] ?? null))
            .map(property => [getSyncColumnName(descriptor, property), merged[property]])
    );
