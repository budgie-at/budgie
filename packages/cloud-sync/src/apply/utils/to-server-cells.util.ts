import { isDefined } from '@rnw-community/shared';

import { normalizeSyncCell } from './normalize-sync-cell.util';
import { readSyncReferenceId } from './read-sync-reference-id.util';

import type { SyncRowInterface } from '../../mapping/interface/sync-row.interface';
import type { SyncTableDescriptorInterface } from '../../mapping/interface/sync-table-descriptor.interface';
import type { SyncCellType } from '../type/sync-cell.type';
import type { SyncResolutionsType } from '../type/sync-resolutions.type';

export const toServerCells = (
    descriptor: SyncTableDescriptorInterface,
    row: SyncRowInterface,
    resolutions: SyncResolutionsType,
    unitIds: ReadonlyMap<string, number>
): Record<string, SyncCellType> =>
    Object.fromEntries(
        descriptor.columns.flatMap(column => {
            if (isDefined(column.reference)) {
                return [[column.property, readSyncReferenceId(row, column.property, resolutions, unitIds)]];
            }

            return column.property in row.values ? [[column.property, normalizeSyncCell(row.values[column.property])]] : [];
        })
    );
